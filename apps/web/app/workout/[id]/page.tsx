'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  type Exercise,
  type Workout,
  type VoiceCommand,
  type WeightUnit,
  playerProgress,
  formatTime,
  SPEED_OPTIONS,
  calculate1RM,
} from '@myworkouts/shared';
import { usePlayerStore } from '../../../lib/player-store';
import { useSubscriptionStore } from '../../../lib/subscription-store';
import {
  fetchWorkoutById,
  fetchExercisesByIds,
  startWorkoutSession,
  finishWorkoutSession,
  fetchSubscriptionStatus,
} from '../../../lib/actions';
import { createWebSpeechAdapter, type SpeechRecognitionAdapter } from '../../../lib/speech-recognition';
import { createCameraRecorder, type CameraRecorderAdapter } from '../../../lib/camera-recorder';
import { uploadRecording } from '../../../lib/recording-upload';
import { workoutsPath } from '../../../lib/routes';

// ── Rest Timer Presets ──
const REST_PRESETS = [
  { label: 'Hypertrophy', range: '60-90s', value: 75 },
  { label: 'Strength', range: '120-180s', value: 150 },
  { label: 'Power', range: '180-300s', value: 240 },
];

function getRestTimerPreference(): number {
  if (typeof window === 'undefined') return 90;
  const saved = localStorage.getItem('rest_timer_seconds');
  return saved ? parseInt(saved, 10) : 90;
}

function getPreferredWeightUnit(): WeightUnit {
  if (typeof window === 'undefined') return 'lbs';
  return (localStorage.getItem('preferred_weight_unit') as WeightUnit) || 'lbs';
}

// ── Audio Alert ──
function playRestCompleteBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1100;
      osc2.type = 'sine';
      gain2.gain.value = 0.3;
      osc2.start();
      osc2.stop(ctx.currentTime + 0.3);
    }, 250);
  } catch {
    // Audio not available
  }
}

export default function WorkoutPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { status, dispatch, init } = usePlayerStore();
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(0);

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exerciseMap, setExerciseMap] = useState<Record<string, Exercise>>({});
  const [loading, setLoading] = useState(true);

  // Voice control state
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [voiceCommandLog, setVoiceCommandLog] = useState<Array<{ command: string; time: number }>>([]);
  const speechRef = useRef<SpeechRecognitionAdapter | null>(null);

  // Recording state (Premium only)
  const isPremium = useSubscriptionStore((s) => s.isPremium());
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const cameraRef = useRef<CameraRecorderAdapter | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  // Weight tracking state
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lbs');
  const [setWeights, setSetWeights] = useState<Record<string, number>>({});
  const [setReps, setSetReps] = useState<Record<string, number>>({});
  const [exercisePRs, setExercisePRs] = useState<Record<string, number>>({});
  const [prHits, setPrHits] = useState<Set<string>>(new Set());

  // Rest timer state
  const [defaultRestSeconds, setDefaultRestSeconds] = useState(90);
  const [showRestSettings, setShowRestSettings] = useState(false);
  const restAlertPlayedRef = useRef(false);

  // Load preferences
  useEffect(() => {
    setWeightUnit(getPreferredWeightUnit());
    setDefaultRestSeconds(getRestTimerPreference());
  }, []);

  // Load workout and its exercises
  useEffect(() => {
    void (async () => {
      const w = await fetchWorkoutById(id);
      if (!w) {
        setLoading(false);
        return;
      }
      setWorkout(w);

      // Load exercise details for display
      const exerciseIds = w.exercises.map((e) => e.exercise_id);
      if (exerciseIds.length > 0) {
        const exList = await fetchExercisesByIds(exerciseIds);
        const map: Record<string, Exercise> = {};
        for (const e of exList) {
          map[e.id] = e;
        }
        setExerciseMap(map);
      }

      init(w.exercises);
      setLoading(false);
    })();

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [id, init]);

  // Load subscription status
  const subStore = useSubscriptionStore();
  useEffect(() => {
    void (async () => {
      const sub = await fetchSubscriptionStatus();
      if (sub.plan) {
        subStore.setPlan(sub.plan as any);
        subStore.setStatus(sub.status as any);
        if (sub.expiresAt) subStore.setExpiresAt(sub.expiresAt);
      }
      subStore.setLoading(false);
    })();
  }, []);

  // Camera lifecycle
  useEffect(() => {
    if (!cameraEnabled) {
      cameraRef.current?.destroy();
      cameraRef.current = null;
      setIsRecording(false);
      return;
    }

    const adapter = createCameraRecorder({
      onError: (err) => {
        console.warn('Camera error:', err);
        setCameraEnabled(false);
      },
    });

    if (!adapter) {
      setCameraEnabled(false);
      return;
    }

    cameraRef.current = adapter;
    adapter.startPreview().then(() => {
      if (previewVideoRef.current) {
        adapter.attachPreview(previewVideoRef.current);
      }
    });

    return () => {
      adapter.destroy();
      cameraRef.current = null;
    };
  }, [cameraEnabled]);

  // Derived state (needed by toggleRecording and render)
  const currentExercise = status.exercises[status.currentExerciseIndex];
  const currentDetail = currentExercise ? exerciseMap[currentExercise.exercise_id] : null;
  const progress = playerProgress(status);

  // Current weight key for tracking
  const currentWeightKey = currentExercise
    ? `${currentExercise.exercise_id}-${status.currentSet}`
    : '';

  // Get current set weight (default from exercise definition or previous set)
  const currentWeight = useMemo(() => {
    if (!currentExercise) return 0;
    const explicit = setWeights[currentWeightKey];
    if (explicit !== undefined) return explicit;
    // Fallback to exercise-level weight
    return currentExercise.weight ?? 0;
  }, [currentExercise, currentWeightKey, setWeights]);

  // Get current reps target
  const currentRepsTarget = useMemo(() => {
    if (!currentExercise) return 0;
    return currentExercise.reps ?? 0;
  }, [currentExercise]);

  // Calculate 1RM for current weight and reps
  const current1RM = useMemo(() => {
    if (currentWeight <= 0 || currentRepsTarget <= 0) return 0;
    return calculate1RM(currentWeight, currentRepsTarget);
  }, [currentWeight, currentRepsTarget]);

  // Check if current exercise is in a superset group
  const currentGroupInfo = useMemo(() => {
    if (!currentExercise?.setGroupId) return null;
    const groupId = currentExercise.setGroupId;
    const groupExercises = status.exercises.filter((e) => e.setGroupId === groupId);
    const currentIndex = groupExercises.findIndex(
      (e) => e.exercise_id === currentExercise.exercise_id
    );
    return {
      groupId,
      exercises: groupExercises,
      currentIndex,
      total: groupExercises.length,
      setType: currentExercise.setType ?? 'superset',
    };
  }, [currentExercise, status.exercises]);

  // Drop set weight suggestion
  const dropSetSuggestion = useMemo(() => {
    if (!currentExercise || currentExercise.setType !== 'dropset') return null;
    if (status.currentSet <= 1) return null;
    const prevKey = `${currentExercise.exercise_id}-${status.currentSet - 1}`;
    const prevWeight = setWeights[prevKey] ?? currentExercise.weight ?? 0;
    if (prevWeight <= 0) return null;
    // Suggest 10-20% less (use 15% as middle ground)
    return Math.round(prevWeight * 0.85);
  }, [currentExercise, status.currentSet, setWeights]);

  // Pyramid set weight target
  const pyramidTarget = useMemo(() => {
    if (!currentExercise || currentExercise.setType !== 'pyramid') return null;
    const baseWeight = currentExercise.weight ?? 0;
    if (baseWeight <= 0) return null;
    const totalSets = currentExercise.sets;
    const midpoint = Math.ceil(totalSets / 2);
    const currentSet = status.currentSet;
    if (currentSet <= midpoint) {
      // Ascending: base + increment per set
      const increment = baseWeight * 0.1;
      return Math.round(baseWeight + (currentSet - 1) * increment);
    }
    // Descending
    const setsFromEnd = totalSets - currentSet;
    const increment = baseWeight * 0.1;
    return Math.round(baseWeight + setsFromEnd * increment);
  }, [currentExercise, status.currentSet]);

  // Toggle recording
  const toggleRecording = useCallback(async () => {
    if (!cameraRef.current) return;

    if (isRecording) {
      // Stop recording and upload
      const blob = await cameraRef.current.stopRecording();
      setIsRecording(false);

      if (!sessionId || !currentExercise) return;

      setUploadingCount((c) => c + 1);
      await uploadRecording(
        blob,
        'local-user',
        sessionId,
        currentExercise.exercise_id,
        recordingStartTime,
        status.elapsedTime,
      );
      setUploadingCount((c) => c - 1);
    } else {
      // Start recording
      cameraRef.current.startRecording();
      setIsRecording(true);
      setRecordingStartTime(status.elapsedTime);
    }
  }, [isRecording, sessionId, currentExercise, status.elapsedTime, recordingStartTime]);

  // Stop camera on workout complete
  useEffect(() => {
    if (status.state === 'completed') {
      setCameraEnabled(false);
    }
  }, [status.state]);

  // Play audio alert when rest timer hits 0
  useEffect(() => {
    if (status.state === 'rest' && status.restRemaining > 0) {
      restAlertPlayedRef.current = false;
    }
    if (status.state === 'rest' && status.restRemaining <= 0 && !restAlertPlayedRef.current) {
      restAlertPlayedRef.current = true;
      playRestCompleteBeep();
    }
  }, [status.state, status.restRemaining]);

  // Tick loop: runs when state is 'playing' or 'rest'
  useEffect(() => {
    if (status.state === 'playing' || status.state === 'rest') {
      lastTickRef.current = performance.now();
      tickRef.current = setInterval(() => {
        const now = performance.now();
        const delta = now - lastTickRef.current;
        lastTickRef.current = now;
        dispatch({ type: 'TICK', deltaMs: delta });
      }, 100);
    } else {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    }

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [status.state, dispatch]);

  // Voice command handler
  const handleVoiceCommand = useCallback(
    (command: VoiceCommand) => {
      const time = Date.now();
      setVoiceCommandLog((prev) => [...prev.slice(-9), { command: command.action, time }]);

      switch (command.action) {
        case 'pause':
          dispatch({ type: 'PAUSE' });
          break;
        case 'resume':
          if (status.state === 'idle') dispatch({ type: 'START' });
          else dispatch({ type: 'RESUME' });
          break;
        case 'slower':
          dispatch({ type: 'ADJUST_SPEED', direction: 'slower' });
          break;
        case 'faster':
          dispatch({ type: 'ADJUST_SPEED', direction: 'faster' });
          break;
        case 'normal':
          dispatch({ type: 'ADJUST_SPEED', direction: 'normal' });
          break;
        case 'next':
          dispatch({ type: 'SKIP_EXERCISE' });
          break;
        case 'previous':
        case 'repeat':
          dispatch({ type: 'PREVIOUS_EXERCISE' });
          break;
      }

      // Recording voice commands
      if (command.category === 'recording' && isPremium && cameraEnabled) {
        if (command.action === 'start' && !isRecording) {
          toggleRecording();
        } else if (command.action === 'stop' && isRecording) {
          toggleRecording();
        }
      }
    },
    [dispatch, status.state, isPremium, cameraEnabled, isRecording, toggleRecording],
  );

  // Voice recognition lifecycle
  useEffect(() => {
    if (!voiceEnabled) {
      speechRef.current?.stop();
      speechRef.current = null;
      setIsListening(false);
      return;
    }

    const adapter = createWebSpeechAdapter({
      onCommand: handleVoiceCommand,
      onListeningChange: setIsListening,
      onTranscript: setLastTranscript,
    });

    if (!adapter) {
      setVoiceEnabled(false);
      return;
    }

    speechRef.current = adapter;
    adapter.start();

    return () => {
      adapter.stop();
      speechRef.current = null;
    };
  }, [voiceEnabled, handleVoiceCommand]);

  // Stop voice when workout completes
  useEffect(() => {
    if (status.state === 'completed') {
      setVoiceEnabled(false);
    }
  }, [status.state]);

  // Create session at start so recordings can reference it
  useEffect(() => {
    if (status.state !== 'playing' || sessionId || !workout) return;
    void (async () => {
      const newSessionId = await startWorkoutSession(workout.id);
      setSessionId(newSessionId);
    })();
  }, [status.state, sessionId, workout]);

  // Update session on completion
  useEffect(() => {
    if (status.state !== 'completed' || !sessionId) return;
    void finishWorkoutSession(sessionId, {
      exercises_completed: status.completed,
      voice_commands_used: voiceCommandLog.map((c) => ({
        command: c.command,
        timestamp: c.time,
        recognized: true,
      })),
    });
  }, [status.state, sessionId, status.completed]);

  const handlePlayPause = useCallback(() => {
    if (status.state === 'idle') dispatch({ type: 'START' });
    else if (status.state === 'playing') dispatch({ type: 'PAUSE' });
    else if (status.state === 'paused') dispatch({ type: 'RESUME' });
  }, [status.state, dispatch]);

  // Handle completing a set with weight data
  const handleCompleteSet = useCallback(() => {
    // Save weight data for this set
    if (currentExercise && currentWeight > 0) {
      const reps = currentRepsTarget;
      const estimated1RM = calculate1RM(currentWeight, reps);
      const exerciseId = currentExercise.exercise_id;

      // Check for PR
      const previousBest = exercisePRs[exerciseId] ?? 0;
      if (estimated1RM > previousBest) {
        setExercisePRs((prev) => ({ ...prev, [exerciseId]: estimated1RM }));
        setPrHits((prev) => new Set(prev).add(exerciseId));
      }
    }

    dispatch({ type: 'COMPLETE_SET' });
  }, [currentExercise, currentWeight, currentRepsTarget, exercisePRs, dispatch]);

  const handleRestTimerChange = useCallback((seconds: number) => {
    const clamped = Math.max(30, Math.min(300, seconds));
    setDefaultRestSeconds(clamped);
    localStorage.setItem('rest_timer_seconds', String(clamped));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Loading workout...</p>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Workout not found.</p>
        <button
          type="button"
          onClick={() => router.push(workoutsPath('/workouts'))}
          className="text-indigo-500 hover:underline"
        >
          Back to Workouts
        </button>
      </div>
    );
  }

  // ── Completed Screen ──
  if (status.state === 'completed') {
    const totalVolume = status.completed.reduce((sum, c) => {
      const w = c.weight ?? 0;
      const r = c.reps_completed ?? 0;
      const s = c.sets_completed;
      return sum + w * r * s;
    }, 0);

    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <div className="text-6xl mb-4">&#127942;</div>
        <h1 className="text-3xl font-bold text-gray-900">Workout Complete!</h1>
        <p className="mt-2 text-gray-500">
          {workout.title} &middot; {formatTime(status.elapsedTime)}
        </p>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-indigo-50 p-4">
            <p className="text-2xl font-bold text-indigo-600">{status.completed.length}</p>
            <p className="text-xs text-gray-500">Exercises</p>
          </div>
          <div className="rounded-xl bg-green-50 p-4">
            <p className="text-2xl font-bold text-green-600">
              {status.completed.reduce((s, c) => s + c.sets_completed, 0)}
            </p>
            <p className="text-xs text-gray-500">Total Sets</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-2xl font-bold text-amber-600">{formatTime(status.elapsedTime)}</p>
            <p className="text-xs text-gray-500">Duration</p>
          </div>
        </div>

        {/* Volume and PRs */}
        {totalVolume > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-purple-50 p-4">
              <p className="text-2xl font-bold text-purple-600">
                {totalVolume.toLocaleString()} {weightUnit}
              </p>
              <p className="text-xs text-gray-500">Total Volume</p>
            </div>
            {prHits.size > 0 && (
              <div className="rounded-xl bg-yellow-50 p-4">
                <p className="text-2xl font-bold text-yellow-600">{prHits.size}</p>
                <p className="text-xs text-gray-500">PRs Hit!</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {sessionId && isPremium && (
            <button
              type="button"
              onClick={() => router.push(workoutsPath('/recordings'))}
              className="rounded-lg border border-indigo-300 px-8 py-3 font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              Review Recordings
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push(workoutsPath('/workouts'))}
            className="rounded-lg bg-indigo-500 px-8 py-3 font-semibold text-white hover:bg-indigo-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── Player Screen ──
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &#x25C0; Exit
        </button>
        <h2 className="font-semibold text-gray-900 truncate mx-4">{workout.title}</h2>
        <div className="flex items-center gap-2">
          {/* Voice Toggle */}
          <button
            type="button"
            onClick={() => setVoiceEnabled((v) => !v)}
            className={`relative rounded-full p-2 transition-colors ${
              voiceEnabled
                ? 'bg-red-100 text-red-600'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title={voiceEnabled ? 'Voice on (click to mute)' : 'Enable voice commands'}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
            {isListening && (
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>
          {/* Camera Toggle (Premium) */}
          {isPremium && (
            <button
              type="button"
              onClick={() => setCameraEnabled((v) => !v)}
              className={`relative rounded-full p-2 transition-colors ${
                cameraEnabled
                  ? 'bg-amber-100 text-amber-600'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title={cameraEnabled ? 'Camera on (click to turn off)' : 'Enable form recording'}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
              {isRecording && (
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          )}
          <span className="text-sm text-gray-400">{formatTime(status.elapsedTime)}</span>
        </div>
      </div>

      {/* Camera PiP Overlay */}
      {cameraEnabled && (
        <div className="fixed bottom-36 right-4 z-40 w-40 rounded-xl overflow-hidden shadow-lg border-2 border-white/80">
          <video
            ref={previewVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-auto -scale-x-100 bg-black"
          />
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 bg-black/50 py-1">
            <button
              type="button"
              onClick={toggleRecording}
              className={`rounded-full p-1.5 transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white'
                  : 'bg-white/90 text-gray-700 hover:bg-white'
              }`}
              title={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isRecording ? (
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="8" />
                </svg>
              )}
            </button>
            {isRecording && (
              <span className="text-xs text-red-300 font-mono">REC</span>
            )}
          </div>
          {uploadingCount > 0 && (
            <div className="absolute top-1 left-1 rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] text-white">
              Uploading...
            </div>
          )}
        </div>
      )}

      {/* Voice Feedback */}
      {voiceEnabled && lastTranscript && (
        <div className="mb-2 rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-500">
          <span className="text-red-400 mr-1">&#9679;</span>
          Heard: &ldquo;{lastTranscript}&rdquo;
        </div>
      )}

      {/* Superset Group Indicator */}
      {currentGroupInfo && status.state !== 'rest' && (
        <div className="mb-3 rounded-lg bg-purple-50 border border-purple-200 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
              {currentGroupInfo.setType === 'superset' ? 'Superset' :
               currentGroupInfo.setType === 'dropset' ? 'Drop Set' :
               currentGroupInfo.setType === 'giant' ? 'Giant Set' :
               currentGroupInfo.setType === 'pyramid' ? 'Pyramid' : 'Group'}
            </span>
            <span className="text-xs text-purple-500">
              {currentGroupInfo.currentIndex + 1} of {currentGroupInfo.total}
            </span>
          </div>
          <div className="flex gap-1 mt-1.5">
            {currentGroupInfo.exercises.map((ge, gi) => {
              const name = exerciseMap[ge.exercise_id]?.name ?? 'Exercise';
              const isActive = gi === currentGroupInfo.currentIndex;
              return (
                <div
                  key={ge.exercise_id}
                  className={`flex-1 rounded px-2 py-1 text-xs text-center truncate ${
                    isActive
                      ? 'bg-purple-500 text-white font-medium'
                      : 'bg-purple-100 text-purple-400'
                  }`}
                >
                  {name}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-gray-400">
          <span>
            Exercise {Math.min(status.currentExerciseIndex + 1, status.exercises.length)} of{' '}
            {status.exercises.length}
          </span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
      </div>

      {/* Rest Overlay */}
      {status.state === 'rest' && (
        <div className="mb-6 rounded-2xl bg-blue-50 border border-blue-200 p-8 text-center relative">
          {/* Rest Settings Gear */}
          <button
            type="button"
            onClick={() => setShowRestSettings((v) => !v)}
            className="absolute top-3 right-3 text-blue-400 hover:text-blue-600 p-1"
            title="Rest timer settings"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Rest Settings Panel */}
          {showRestSettings && (
            <div className="absolute top-12 right-3 z-10 w-64 rounded-lg bg-white shadow-lg border border-gray-200 p-4 text-left">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Rest Timer Settings</h4>
              <div className="mb-3">
                <label className="text-xs text-gray-500 block mb-1">Default rest (seconds)</label>
                <input
                  type="number"
                  min={30}
                  max={300}
                  value={defaultRestSeconds}
                  onChange={(e) => handleRestTimerChange(parseInt(e.target.value) || 90)}
                  className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm text-center"
                />
              </div>
              <div className="space-y-1.5">
                {REST_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleRestTimerChange(preset.value)}
                    className={`w-full rounded px-3 py-1.5 text-xs text-left transition-colors ${
                      defaultRestSeconds === preset.value
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {preset.label} ({preset.range})
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">Rest</p>
          <p className="text-5xl font-bold text-blue-700 mt-2">
            {formatTime(status.restRemaining)}
          </p>
          <p className="mt-3 text-sm text-blue-500">
            Next: {currentDetail?.name ?? 'Next exercise'}
          </p>
          <button
            type="button"
            onClick={() => dispatch({ type: 'REST_COMPLETE' })}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Skip rest
          </button>
        </div>
      )}

      {/* Current Exercise Card */}
      {status.state !== 'rest' && currentDetail && (
        <div className="mb-6">
          {/* Video Placeholder */}
          <div className="relative mb-4 flex h-48 items-center justify-center rounded-xl bg-gray-100 overflow-hidden">
            {currentDetail.video_url ? (
              <video
                ref={(el) => { if (el) el.playbackRate = status.speed; }}
                src={currentDetail.video_url}
                className="h-full w-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                </svg>
                <span className="text-sm">Video coming soon</span>
              </div>
            )}
          </div>

          {/* Exercise Info */}
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold text-gray-900">{currentDetail.name}</h3>
            {/* PR Badge */}
            {prHits.has(currentExercise!.exercise_id) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-700">
                &#9733; PR
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">{currentDetail.description}</p>

          {/* Weight Input */}
          <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Weight</span>
              {current1RM > 0 && (
                <span className="text-xs text-gray-500">
                  Est. 1RM: <span className="font-semibold text-gray-700">{current1RM} {weightUnit}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="number"
                  min={0}
                  step={2.5}
                  value={setWeights[currentWeightKey] ?? currentWeight || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setSetWeights((prev) => ({
                      ...prev,
                      [currentWeightKey]: isNaN(val) ? 0 : val,
                    }));
                  }}
                  placeholder="0"
                  className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-center text-lg font-semibold text-gray-900"
                />
                <span className="text-sm text-gray-500 font-medium">{weightUnit}</span>
              </div>

              {/* Quick adjust buttons */}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const curr = setWeights[currentWeightKey] ?? currentWeight;
                    const step = weightUnit === 'lbs' ? 5 : 2.5;
                    setSetWeights((prev) => ({
                      ...prev,
                      [currentWeightKey]: Math.max(0, curr - step),
                    }));
                  }}
                  className="rounded-lg bg-gray-200 px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-300"
                >
                  -{weightUnit === 'lbs' ? '5' : '2.5'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const curr = setWeights[currentWeightKey] ?? currentWeight;
                    const step = weightUnit === 'lbs' ? 5 : 2.5;
                    setSetWeights((prev) => ({
                      ...prev,
                      [currentWeightKey]: curr + step,
                    }));
                  }}
                  className="rounded-lg bg-gray-200 px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-300"
                >
                  +{weightUnit === 'lbs' ? '5' : '2.5'}
                </button>
              </div>
            </div>

            {/* Drop set suggestion */}
            {dropSetSuggestion !== null && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-amber-600">Suggested drop weight:</span>
                <button
                  type="button"
                  onClick={() =>
                    setSetWeights((prev) => ({
                      ...prev,
                      [currentWeightKey]: dropSetSuggestion,
                    }))
                  }
                  className="text-xs font-semibold text-amber-700 bg-amber-100 rounded px-2 py-0.5 hover:bg-amber-200"
                >
                  {dropSetSuggestion} {weightUnit}
                </button>
              </div>
            )}

            {/* Pyramid target */}
            {pyramidTarget !== null && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-indigo-600">Pyramid target:</span>
                <button
                  type="button"
                  onClick={() =>
                    setSetWeights((prev) => ({
                      ...prev,
                      [currentWeightKey]: pyramidTarget,
                    }))
                  }
                  className="text-xs font-semibold text-indigo-700 bg-indigo-100 rounded px-2 py-0.5 hover:bg-indigo-200"
                >
                  {pyramidTarget} {weightUnit}
                </button>
              </div>
            )}
          </div>

          {/* Set/Rep Counter */}
          <div className="mt-4 flex items-center gap-6">
            <div className="rounded-xl bg-gray-100 px-6 py-3 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {status.currentSet} / {currentExercise!.sets}
              </p>
              <p className="text-xs text-gray-500">Set</p>
            </div>

            {currentExercise!.reps ? (
              <div className="rounded-xl bg-gray-100 px-6 py-3 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {status.currentRep} / {currentExercise!.reps}
                </p>
                <p className="text-xs text-gray-500">Reps</p>
              </div>
            ) : currentExercise!.duration ? (
              <div className="rounded-xl bg-gray-100 px-6 py-3 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {formatTime(Math.max(0, (currentExercise!.duration * 1000) - status.exerciseElapsed))}
                </p>
                <p className="text-xs text-gray-500">Remaining</p>
              </div>
            ) : null}
          </div>

          {/* Rep/Set Complete Buttons */}
          {currentExercise!.reps && status.state === 'playing' && (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => dispatch({ type: 'COMPLETE_REP' })}
                className="flex-1 rounded-lg border border-indigo-300 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
              >
                +1 Rep
              </button>
              <button
                type="button"
                onClick={handleCompleteSet}
                className="flex-1 rounded-lg bg-indigo-100 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
              >
                Complete Set
              </button>
            </div>
          )}
        </div>
      )}

      {/* Transport Controls */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          {/* Previous */}
          <button
            type="button"
            onClick={() => dispatch({ type: 'PREVIOUS_EXERCISE' })}
            disabled={status.currentExerciseIndex === 0}
            className="rounded-full p-3 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            type="button"
            onClick={handlePlayPause}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg hover:bg-indigo-600 transition-colors"
          >
            {status.state === 'playing' ? (
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="h-8 w-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Next / Skip */}
          <button
            type="button"
            onClick={() => dispatch({ type: 'SKIP_EXERCISE' })}
            disabled={status.currentExerciseIndex >= status.exercises.length}
            className="rounded-full p-3 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Speed Control */}
        <div className="mx-auto mt-3 flex max-w-2xl items-center justify-center gap-1">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() =>
                dispatch({
                  type: 'ADJUST_SPEED',
                  direction: s === 1.0 ? 'normal' : s > status.speed ? 'faster' : 'slower',
                })
              }
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                Math.abs(status.speed - s) < 0.01
                  ? 'bg-indigo-500 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Bottom spacer for fixed controls */}
      <div className="h-32" />
    </div>
  );
}
