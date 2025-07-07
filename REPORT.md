# Main features built and why

## Realtime translation of speech from english to spanish and spanish to english.

This was the primary requirement

## Detection mode (switch between using AI and regex to detect medical actions)

The regex/pattern matching with some AI enhancement is probably the best way to handle this in production, but for this demo using AI will make the demo feel more complete.

The main complication is building out a comprehensive set of medical terms to detect, so for now we can just use AI for basic detection.

## Webhooks

This is to simulate submitting the medical actions to another system (internal or external) for processing.

## Sample transcripts

This just helps with testing as my spanish is very limited, so having some samples to load in the UI helps expedite testing. We would either remove these in production or feature flag them to specific environments if helpful to others.

## Past conversation list

Just a simple list of past conversations. This is mostly a placeholder, but lets us know things are getting stored in the database.

## Generate Summary Report

We can generate a summary report at anytime manually. This enabled testing the report generation, but should be moved to happen automatically at the end of a conversation.

## Medica Action Validation

Medical actions must each be validated by a human before they are submitted. This is a simple human in the loop to ensure prescriptions and procedures are not mis-translated.

# Things not used or not ideal

## No authentication

We have not implemented authentication as this is just a prototype.

## The webhook integration seems to be spotty

I would need a little time to debug this, it worked locally but doesn't seem to work once deployed.

## React Router

As this is a Next.js app, react router was not used.

## Redux

Normally I would not use redux in a Next.js app, but it was specifically requested in the requirements.

## Explicit processing of the text for medical terms

We are doing this with AI, we have a toggle to do this with non AI more explicite code, but it would take some time to integrate and test this with a full set of medical terms.

# Areas to improvie

- [ ] Sometimes the agent things you are talking directly to it and doesn't know it should translate.
  - [ ] Sometimes if you start a new conversation with "Tell me about your chest pain"
- [ ] Sometimes the medications are off, but that could be my own pronunciation getting in the way.
- [ ] The UI is cluttered and we should pull things like webhook and detection mode settings into a settings modal.
- [ ] Currently not mobile friendly, but we should make it so.
- [ ] Repeate that can be spoken out loud, or clicked, but it isn't always reliable yet.
- [ ] We likely don't need a separate utterance collection if we stay in mongo, we might want to just embed the utterances in the conversation collection..

