import { parseVoiceCommand, type VoiceCommand } from '@myworkouts/shared';

export interface SpeechRecognitionAdapter {
  start: () => void;
  stop: () => void;
  isListening: boolean;
}

type OnCommand = (command: VoiceCommand) => void;
type OnListeningChange = (listening: boolean) => void;
type OnTranscript = (transcript: string) => void;

interface SpeechRecognitionConfig {
  onCommand: OnCommand;
  onListeningChange?: OnListeningChange;
  onTranscript?: OnTranscript;
}

// Web Speech API types (not included in default lib.dom.d.ts for all TS configs)
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEventType {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventType {
  readonly error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventType) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventType) => void) | null;
  start(): void;
  stop(): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionAPI(): SpeechRecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
}

export function createWebSpeechAdapter(
  config: SpeechRecognitionConfig,
): SpeechRecognitionAdapter | null {
  const SpeechRecognitionAPI = getSpeechRecognitionAPI();
  if (!SpeechRecognitionAPI) return null;

  const recognition = new SpeechRecognitionAPI();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  let isListening = false;
  let shouldRestart = false;

  recognition.onresult = (event) => {
    const last = event.results[event.results.length - 1];
    if (!last?.isFinal) return;

    const transcript = last[0].transcript.trim();
    config.onTranscript?.(transcript);

    const command = parseVoiceCommand(transcript);
    if (command) {
      config.onCommand(command);
    }
  };

  recognition.onstart = () => {
    isListening = true;
    config.onListeningChange?.(true);
  };

  recognition.onend = () => {
    isListening = false;
    config.onListeningChange?.(false);
    if (shouldRestart) {
      try {
        recognition.start();
      } catch {
        // Already started
      }
    }
  };

  recognition.onerror = (event) => {
    if (event.error === 'no-speech' || event.error === 'aborted') return;
    console.warn('Speech recognition error:', event.error);
  };

  return {
    get isListening() {
      return isListening;
    },
    start() {
      shouldRestart = true;
      try {
        recognition.start();
      } catch {
        // Already started
      }
    },
    stop() {
      shouldRestart = false;
      try {
        recognition.stop();
      } catch {
        // Already stopped
      }
    },
  };
}
