# Voice Control Patterns Research

> **Date:** 2026-02-20
> **Purpose:** Inform F5 (Voice Command System) implementation

## Speech-to-Text Libraries for React Native / Expo

### @react-native-voice/voice (Recommended for Mobile)
**Package:** `@react-native-voice/voice` (npm)
**GitHub:** react-native-voice/voice

- Uses native platform STT: iOS Speech Framework, Android SpeechRecognizer
- Supports continuous/partial results (essential for real-time command recognition)
- Events: `onSpeechStart`, `onSpeechEnd`, `onSpeechResults`, `onSpeechPartialResults`, `onSpeechError`
- Supported languages: 50+ (en-US default)
- No network dependency for basic recognition (on-device models on iOS 13+, Android varies)
- **Expo compatibility:** Requires custom dev client (not compatible with Expo Go). Use `expo-dev-client` + config plugin.
- **Latency:** Partial results arrive in ~200-500ms, final results in ~1-2s after speech ends

### expo-speech (TTS only — not STT)
- Only handles text-to-speech (reading text aloud)
- Useful for audio cues ("Next exercise: bicep curls") but NOT for voice command input
- Use for the audio cue system, not for command recognition

### Web Speech API (Web)
**Browser support:** Chrome, Edge, Safari (experimental). Firefox: no support.

- `SpeechRecognition` interface for continuous listening
- `continuous = true` + `interimResults = true` for real-time partial transcripts
- Free, no API key needed
- On-device in Chrome (since v110 on desktop)
- **Latency:** ~300ms for interim results, ~1s for final
- **Limitation:** Chrome stops listening after ~60s of silence — need to restart periodically

### Cloud Alternatives (Not Recommended for MVP)
- **Deepgram:** Best accuracy in noisy environments, but requires API key + network
- **Whisper (OpenAI):** Excellent accuracy but batch-only (not real-time streaming)
- **Google Cloud Speech:** High accuracy, streaming support, but paid + network dependent

### Recommendation
Use `@react-native-voice/voice` for mobile and Web Speech API for web. Both are free, on-device capable, and support continuous listening with partial results. Cloud STT is overkill for command recognition (short phrases, limited vocabulary).

## Gym Noise Handling

### The Problem
Gym environments include: music (often loud), clanking weights, other people talking, treadmill/machine noise, fans/HVAC. SNR (signal-to-noise ratio) is significantly lower than typical indoor environments.

### Mitigation Strategies

1. **Limited vocabulary matching (most effective)**
   - Our command set is ~20 phrases. The voice parser does substring matching, not open-ended transcription.
   - Even noisy partial transcripts often contain the key word ("pause", "slower", "next")
   - Confidence threshold: only act on commands with confidence > 0.7

2. **Short command phrases**
   - All commands are 1-3 words. Shorter phrases are more reliably recognized in noise.
   - Avoid requiring full sentences ("Hey MyWorkouts, please slow down" → just "slower")

3. **No wake word (always-listening during workout)**
   - Wake words ("Hey Siri") require constant background processing and often fail in noise
   - Better approach: listen continuously only during active workout, with visual indicator
   - Use a prominent "mic on/off" toggle so users can disable when not needed

4. **Post-processing with fuzzy matching**
   - The shared voice parser already uses `includes()` for fuzzy matching
   - Add Levenshtein distance matching for common misrecognitions ("paws" → "pause", "slow" → "slower")
   - Maintain a synonym map: {"go" → "resume", "hold" → "pause", "wait" → "pause"}

5. **Visual confirmation**
   - Always show what command was detected with a brief toast/overlay
   - This lets users correct if wrong ("that wasn't right" → undo last command)

### What NOT to Do
- Don't require a wake word — adds friction when hands are occupied
- Don't use cloud STT — adds latency and network dependency in a gym (spotty WiFi)
- Don't try to filter audio before STT — platform SDKs already do noise cancellation

## Wake Word vs. Always-Listening

### Always-Listening During Workout (Recommended)

| Aspect | Always-Listening | Wake Word |
|--------|-----------------|-----------|
| User friction | Zero — just speak | Must say wake word first |
| False positives | Higher — may trigger on ambient speech | Lower — wake word gates commands |
| Battery impact | Moderate (STT running continuously) | Lower (only keyword detection until woken) |
| Implementation | Simpler — just keep STT session alive | Complex — need separate keyword spotter |
| Gym suitability | Better — no multi-step commands with weights in hands | Worse — "Hey MyWorkouts, pause" is too long |

### Recommended Approach
- **During active workout:** Always-listening with STT active. Visual "listening" indicator shown.
- **Outside workout:** STT off. All controls are touch-based.
- **Mute toggle:** Users can tap a mic icon to disable voice during workout if desired.
- **False positive mitigation:** Show detected command briefly before executing, with ~1s delay and cancel option.

## Latency Requirements

| Stage | Target | Acceptable |
|-------|--------|-----------|
| Speech → Partial transcript | < 500ms | < 800ms |
| Partial transcript → Command match | < 50ms | < 100ms |
| Command match → UI response | < 100ms | < 200ms |
| **Total: Speech → Action** | **< 650ms** | **< 1100ms** |

At < 650ms total, voice feels "responsive" — comparable to tapping a button. At > 1.5s, it feels broken.

### How to Achieve This
- Use partial results (interim transcripts) to match commands before speech ends
- The parser should run on every partial result, not wait for final
- Pre-load audio cue responses ("Paused", "Speeding up") so TTS doesn't add delay
- Use requestAnimationFrame or immediate state update for UI response

## Architecture Summary

```
                    ┌─────────────────────────┐
                    │   Platform STT Adapter   │
                    │  (mobile: @rn-voice)     │
                    │  (web: SpeechRecognition) │
                    └──────────┬──────────────┘
                               │ partial/final transcript
                    ┌──────────▼──────────────┐
                    │   Voice Command Parser   │
                    │  (packages/shared/voice)  │
                    │  - fuzzy matching         │
                    │  - confidence scoring     │
                    │  - synonym expansion      │
                    └──────────┬──────────────┘
                               │ VoiceCommand | null
                    ┌──────────▼──────────────┐
                    │   Workout Player Store   │
                    │  (Zustand action dispatch)│
                    │  - pause/resume           │
                    │  - speed adjustment       │
                    │  - navigation             │
                    └─────────────────────────┘
```
