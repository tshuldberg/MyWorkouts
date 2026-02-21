/**
 * Camera recording adapter using getUserMedia + MediaRecorder.
 * Records the user's front-facing camera during workouts for form review.
 */

export interface CameraRecorderAdapter {
  /** Start camera preview (does not record yet) */
  startPreview: () => Promise<void>;
  /** Start recording from the active preview stream */
  startRecording: () => void;
  /** Stop recording and return the recorded blob */
  stopRecording: () => Promise<Blob>;
  /** Stop everything and release the camera */
  destroy: () => void;
  /** Attach the preview stream to a video element */
  attachPreview: (video: HTMLVideoElement) => void;
  readonly isRecording: boolean;
  readonly isPreviewing: boolean;
}

interface CameraRecorderConfig {
  onRecordingComplete?: (blob: Blob) => void;
  onError?: (error: string) => void;
  facingMode?: 'user' | 'environment';
}

function getPreferredMimeType(): string {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

export function createCameraRecorder(
  config: CameraRecorderConfig = {},
): CameraRecorderAdapter | null {
  if (typeof window === 'undefined') return null;
  if (!navigator.mediaDevices?.getUserMedia) return null;
  if (typeof MediaRecorder === 'undefined') return null;

  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let isRecording = false;
  let isPreviewing = false;
  let resolveBlob: ((blob: Blob) => void) | null = null;

  return {
    get isRecording() {
      return isRecording;
    },
    get isPreviewing() {
      return isPreviewing;
    },

    async startPreview() {
      if (stream) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: config.facingMode ?? 'user', width: 640, height: 480 },
          audio: false,
        });
        isPreviewing = true;
      } catch (err) {
        config.onError?.(`Camera access denied: ${err}`);
      }
    },

    attachPreview(video: HTMLVideoElement) {
      if (stream) {
        video.srcObject = stream;
      }
    },

    startRecording() {
      if (!stream || isRecording) return;
      chunks = [];

      const mimeType = getPreferredMimeType();
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const mType = recorder?.mimeType ?? 'video/webm';
        const blob = new Blob(chunks, { type: mType });
        chunks = [];
        isRecording = false;
        config.onRecordingComplete?.(blob);
        if (resolveBlob) {
          resolveBlob(blob);
          resolveBlob = null;
        }
      };

      recorder.start(1000); // collect data every 1s
      isRecording = true;
    },

    stopRecording(): Promise<Blob> {
      return new Promise<Blob>((resolve, reject) => {
        if (!recorder || !isRecording) {
          reject(new Error('Not recording'));
          return;
        }
        resolveBlob = resolve;
        recorder.stop();
      });
    },

    destroy() {
      if (recorder && isRecording) {
        try {
          recorder.stop();
        } catch {
          // Already stopped
        }
      }
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        stream = null;
      }
      isPreviewing = false;
      isRecording = false;
      recorder = null;
      chunks = [];
      resolveBlob = null;
    },
  };
}
