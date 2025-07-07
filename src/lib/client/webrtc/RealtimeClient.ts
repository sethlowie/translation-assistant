export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';

export interface RealtimeClientEvents {
  statusChanged: (status: ConnectionStatus) => void;
  error: (error: Error) => void;
  audioReceived: (audio: ArrayBuffer) => void;
}

export class RealtimeClient {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private remoteAudioElement: HTMLAudioElement | null = null;
  private status: ConnectionStatus = 'idle';
  private listeners: Partial<RealtimeClientEvents> = {};
  
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

  async connect(): Promise<void> {
    try {
      this.setStatus('connecting');

      // 1. Get ephemeral token
      const tokenResponse = await fetch("/api/session", { method: "POST" });
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
      };

      this.dc.onmessage = (event) => {
        console.log("Data channel message:", event.data);
        try {
          const message = JSON.parse(event.data);
          // Handle different message types here
          console.log("Parsed message:", message);
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

  sendMessage(message: unknown): void {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Data channel is not open');
    }
    
    this.dc.send(JSON.stringify(message));
  }
}