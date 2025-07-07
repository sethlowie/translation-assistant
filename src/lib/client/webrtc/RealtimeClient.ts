export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';

export interface RealtimeEvent {
  type: string;
  item?: {
    id?: string;
    role?: string;
    content?: Array<{
      transcript?: string;
      type?: string;
      text?: string;
    }>;
  };
  transcript?: string; // For transcription events
  delta?: string; // For delta events
  error?: {
    message?: string;
  };
  [key: string]: unknown;
}

export interface UtteranceEvent {
  role: 'clinician' | 'patient';
  originalText: string;
  language: 'en' | 'es';
  timestamp: string;
}

export interface TranslationEvent {
  translatedText: string;
  language: 'en' | 'es';
}

export interface RealtimeClientEvents {
  statusChanged: (status: ConnectionStatus) => void;
  error: (error: Error) => void;
  audioReceived: (audio: ArrayBuffer) => void;
  utterance: (event: UtteranceEvent) => void;
  translation: (event: TranslationEvent) => void;
  speechStart: () => void;
  speechEnd: () => void;
}

export interface SessionConfig {
  languages: {
    primary: 'en' | 'es';
    secondary: 'en' | 'es';
  };
}

export class RealtimeClient {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private remoteAudioElement: HTMLAudioElement | null = null;
  private status: ConnectionStatus = 'idle';
  private listeners: Partial<RealtimeClientEvents> = {};
  private languages: SessionConfig['languages'] = { primary: 'en', secondary: 'es' };
  private lastUtteranceId: string | null = null;
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.remoteAudioElement = document.createElement('audio');
      this.remoteAudioElement.autoplay = true;
    }
  }

  on<K extends keyof RealtimeClientEvents>(
    event: K, 
    listener: RealtimeClientEvents[K]
  ): void {
    this.listeners[event] = listener;
  }

  private emit<K extends keyof RealtimeClientEvents>(
    event: K,
    ...args: Parameters<RealtimeClientEvents[K]>
  ): void {
    const listener = this.listeners[event];
    if (listener) {
      (listener as (...args: Parameters<RealtimeClientEvents[K]>) => void)(...args);
    }
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.emit('statusChanged', status);
  }

  async connect(config?: SessionConfig): Promise<void> {
    try {
      this.setStatus('connecting');
      
      if (config) {
        this.languages = config.languages;
      }

      // 1. Get ephemeral token
      const tokenResponse = await fetch("/api/session", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryLanguage: this.languages.primary,
          secondaryLanguage: this.languages.secondary,
        }),
      });
      
      if (!tokenResponse.ok) {
        throw new Error("Failed to get session token");
      }
      
      const { data } = await tokenResponse.json();
      if (!data?.token) {
        throw new Error("Invalid session response");
      }

      // 2. Create peer connection
      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      // 3. Set up event handlers
      this.pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", this.pc?.iceConnectionState);
        if (this.pc?.iceConnectionState === 'connected') {
          this.setStatus('connected');
        } else if (this.pc?.iceConnectionState === 'failed') {
          this.setStatus('error');
          this.emit('error', new Error('ICE connection failed'));
        }
      };

      this.pc.ontrack = (event) => {
        console.log("Remote track received:", event.track.kind);
        if (event.track.kind === 'audio' && this.remoteAudioElement) {
          const remoteStream = new MediaStream([event.track]);
          this.remoteAudioElement.srcObject = remoteStream;
        }
      };

      // 4. Get user media and add tracks
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      this.localStream.getTracks().forEach((track) => {
        if (this.pc && this.localStream) {
          this.pc.addTrack(track, this.localStream);
        }
      });

      // 5. Create data channel for events
      this.dc = this.pc.createDataChannel("oai-events", {
        ordered: true,
      });

      this.dc.onopen = () => {
        console.log("Data channel opened");
        // Send initial configuration to enable transcription
        this.sendEvent({
          type: "session.update",
          session: {
            input_audio_transcription: {
              model: "whisper-1"
            }
          }
        });
      };

      this.dc.onmessage = (event) => {
        console.log("Data channel message:", event.data);
        try {
          const realtimeEvent: RealtimeEvent = JSON.parse(event.data);
          this.handleRealtimeEvent(realtimeEvent);
        } catch (error) {
          console.error("Failed to parse data channel message:", error);
        }
      };

      this.dc.onerror = (error) => {
        console.error("Data channel error:", error);
        this.emit('error', new Error('Data channel error'));
      };

      // 6. Create offer
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // 7. Exchange SDP with OpenAI
      const sdpResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
        {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${data.token}`,
            "Content-Type": "application/sdp",
          },
        },
      );

      if (!sdpResponse.ok) {
        throw new Error(`SDP exchange failed: ${sdpResponse.status}`);
      }

      const answerSdp = await sdpResponse.text();
      await this.pc.setRemoteDescription({ 
        type: "answer", 
        sdp: answerSdp 
      });

      console.log("WebRTC connection established successfully");

    } catch (error) {
      console.error("Connection failed:", error);
      this.setStatus('error');
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
      this.disconnect();
      throw error;
    }
  }

  disconnect(): void {
    console.log("Disconnecting WebRTC client");
    
    // Stop local media tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close data channel
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }

    // Close peer connection
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    // Clear audio element
    if (this.remoteAudioElement) {
      this.remoteAudioElement.srcObject = null;
    }

    this.setStatus('disconnected');
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  private handleRealtimeEvent(event: RealtimeEvent): void {
    // Enhanced logging for debugging
    console.log("Realtime event received:", {
      type: event.type,
      hasItem: !!event.item,
      itemRole: event.item?.role,
      hasContent: !!event.item?.content,
      contentLength: event.item?.content?.length,
      transcript: event.item?.content?.[0]?.transcript
    });

    switch (event.type) {
      // User's audio transcription completed
      case "conversation.item.input_audio_transcription.completed":
        if (event.transcript) {
          console.log("User transcription completed:", event.transcript);
          const role = this.detectSpeakerRole();
          this.emit('utterance', {
            role,
            originalText: event.transcript as string,
            language: this.languages.primary,
            timestamp: new Date().toISOString(),
          });
        }
        break;

      // Conversation item created (user or assistant)
      case "conversation.item.created":
        if (event.item?.role === "user" && event.item?.content?.[0]?.transcript) {
          console.log("User item created with transcript:", event.item.content[0].transcript);
          const role = this.detectSpeakerRole();
          this.lastUtteranceId = event.item.id || null;
          this.emit('utterance', {
            role,
            originalText: event.item.content[0].transcript,
            language: this.languages.primary,
            timestamp: new Date().toISOString(),
          });
        } else if (event.item?.role === "assistant") {
          console.log("Assistant item created:", event.item);
          // Assistant items might not have transcript immediately
        }
        break;

      // Assistant's audio transcript updates
      case "response.audio_transcript.delta":
        if (event.delta) {
          console.log("Assistant transcript delta:", event.delta);
          // Could accumulate deltas here if needed
        }
        break;

      case "response.audio_transcript.done":
        if (event.transcript) {
          console.log("Assistant transcript done:", event.transcript);
          this.emit('translation', {
            translatedText: event.transcript as string,
            language: this.languages.secondary,
          });
        }
        break;

      // Response completed with all content
      case "response.done":
        console.log("Response done event:", event);
        // Check if response contains transcript
        if (event.response && typeof event.response === 'object') {
          const response = event.response as {
            output?: Array<{
              content?: Array<{
                transcript?: string;
              }>;
            }>;
          };
          if (response.output?.[0]?.content?.[0]?.transcript) {
            console.log("Assistant final transcript:", response.output[0].content[0].transcript);
            this.emit('translation', {
              translatedText: response.output[0].content[0].transcript,
              language: this.languages.secondary,
            });
          }
        }
        break;

      case "input_audio_buffer.speech_started":
        console.log("Speech started");
        this.emit('speechStart');
        break;

      case "input_audio_buffer.speech_stopped":
        console.log("Speech stopped");
        this.emit('speechEnd');
        break;

      case "error":
        console.error("Realtime API error:", event);
        this.emit('error', new Error(event.error?.message || 'Realtime API error'));
        break;

      default:
        // Log any unhandled events for discovery
        console.log("Unhandled realtime event:", event.type, event);
        break;
    }
  }

  private detectSpeakerRole(): 'clinician' | 'patient' {
    // Simple heuristic - in a real app, this would be more sophisticated
    // For now, we'll assume the primary language speaker is the clinician
    // This could be improved with voice characteristics or explicit UI selection
    return 'clinician';
  }

  sendMessage(message: unknown): void {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Data channel is not open');
    }
    
    this.dc.send(JSON.stringify(message));
  }

  sendEvent(event: RealtimeEvent): void {
    this.sendMessage(event);
  }

  repeatLast(): void {
    this.sendEvent({
      type: "response.create",
      response: {
        modalities: ["text", "audio"],
        instructions: "Repeat the last translation you provided.",
      },
    });
  }

  updateLanguages(languages: SessionConfig['languages']): void {
    this.languages = languages;
    // In a real implementation, we might need to update the session configuration
    // with OpenAI's API, but for now we'll just update locally
  }
}