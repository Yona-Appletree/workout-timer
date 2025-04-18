import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Clock,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Timer,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { TimerEvent } from './computeElapsedTime';
import { TimerNodeProgress, TreeTimerProgress } from './tree-timer';
import {
  Exercise,
  WorkoutState,
  computeWorkoutProgress,
  createExercise,
  createWorkoutState,
} from './workout-state';

// URL encoding/decoding functions
const encodeState = (
  exercises: Exercise[],
  exerciseTimeMs: number,
  restTimeMs: number,
) => {
  // Format: exerciseTimeMs,restTimeMs|exercise1Name|exercise2Name|...
  const exerciseNames = exercises
    .map((ex) => encodeURIComponent(ex.name))
    .join('|');
  return `${exerciseTimeMs},${restTimeMs}|${exerciseNames}`;
};

const decodeState = (encoded: string) => {
  try {
    const [times, ...exerciseNames] = encoded.split('|');
    const [exerciseTimeMs, restTimeMs] = times.split(',').map(Number);

    if (isNaN(exerciseTimeMs) || isNaN(restTimeMs)) {
      throw new Error('Invalid time values');
    }

    const exercises = exerciseNames.map((name) =>
      createExercise(decodeURIComponent(name)),
    );

    return { exercises, exerciseTimeMs, restTimeMs };
  } catch (error) {
    console.error('Failed to decode state:', error);
    return null;
  }
};

// Local storage key
const STORAGE_KEY = 'workout-timer-state';

function App() {
  const [workoutState, setWorkoutState] = useState<WorkoutState>(() => {
    const defaultState = createWorkoutState(
      [createExercise('Exercise 1')],
      30 * 1000, // 30 seconds
      10 * 1000, // 10 seconds
    );
    return defaultState;
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [progress, setProgress] = useState<TreeTimerProgress>(() => {
    const initialProgress = computeWorkoutProgress(workoutState);
    return initialProgress;
  });

  const isRunning =
    workoutState.events.length > 0 &&
    workoutState.events[workoutState.events.length - 1].type !== 'pause';

  // Update progress while timer is running
  useEffect(() => {
    if (!isRunning) return;

    let frameId: number;
    const updateProgress = () => {
      const newProgress = computeWorkoutProgress(workoutState);
      setProgress(newProgress);
      frameId = requestAnimationFrame(updateProgress);
    };

    frameId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(frameId);
  }, [isRunning, workoutState]);

  // Initialize state from URL or local storage on mount
  useEffect(() => {
    const loadInitialState = () => {
      console.log('Loading initial state...');
      const params = new URLSearchParams(window.location.search);
      const encodedState = params.get('state');
      console.log('URL state:', encodedState);

      if (encodedState) {
        const decoded = decodeState(encodedState);
        console.log('Decoded URL state:', decoded);
        if (decoded) {
          setWorkoutState(
            createWorkoutState(
              decoded.exercises,
              decoded.exerciseTimeMs,
              decoded.restTimeMs,
            ),
          );
          console.log('Set state from URL');
          return;
        }
      }

      // Fallback to local storage if no valid URL state
      const storedState = localStorage.getItem(STORAGE_KEY);
      console.log('Local storage state:', storedState);
      if (storedState) {
        const decoded = decodeState(storedState);
        console.log('Decoded local storage state:', decoded);
        if (decoded) {
          setWorkoutState(
            createWorkoutState(
              decoded.exercises,
              decoded.exerciseTimeMs,
              decoded.restTimeMs,
            ),
          );
          console.log('Set state from local storage');
        }
      }
    };

    loadInitialState();
    setIsInitialLoad(false);
  }, []);

  // Update URL and local storage when state changes
  useEffect(() => {
    if (isInitialLoad) return;

    const encoded = encodeState(
      workoutState.exercises,
      workoutState.exerciseTimeMs,
      workoutState.restTimeMs,
    );
    // Update URL
    const newUrl = `${window.location.pathname}?state=${encoded}`;
    window.history.replaceState({}, '', newUrl);
    // Update local storage
    localStorage.setItem(STORAGE_KEY, encoded);
  }, [
    workoutState.exercises,
    workoutState.exerciseTimeMs,
    workoutState.restTimeMs,
    isInitialLoad,
  ]);

  const addExercise = () => {
    const newIndex = workoutState.exercises.length;
    setWorkoutState((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        createExercise('Exercise ' + (prev.exercises.length + 1)),
      ],
    }));
    // Focus the new input after state update
    setTimeout(() => {
      const newInput = inputRefs.current[newIndex];
      if (newInput) {
        newInput.focus();
        newInput.select();
      }
    }, 0);
  };

  const removeExercise = (index: number) => {
    setWorkoutState((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index),
    }));
  };

  const updateExercise = (index: number, name: string) => {
    setWorkoutState((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) =>
        i === index ? { ...exercise, name } : exercise,
      ),
    }));
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const remainingMs = ms % 1000;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}.${remainingMs.toString().padStart(3, '0')}`;
  };

  const addEvent = (event: TimerEvent) => {
    setWorkoutState((prev) => ({
      ...prev,
      events: [...prev.events, event],
    }));
  };

  const startTimer = () => {
    addEvent({ type: 'start', timeMs: Date.now() });
  };

  const pauseTimer = () => {
    addEvent({ type: 'pause', timeMs: Date.now() });
  };

  const resetTimer = () => {
    setWorkoutState((prev) => ({
      ...prev,
      events: [],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center p-4">
      <Card
        className={cn(
          'w-full max-w-2xl p-6 space-y-6 backdrop-blur-lg transition-colors',
          progress.rootProgress.state === 'not-started' && 'bg-black/20',
          progress.rootProgress.state === 'running' && 'bg-black/20',
          progress.rootProgress.state === 'finished' && 'bg-black/20',
        )}
      >
        <div className="flex items-center justify-center space-x-2">
          <Timer className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-primary">Exercise Timer</h1>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="exerciseTime text-red-500">
              Exercise Time (seconds)
            </Label>
            <Input
              id="exerciseTime"
              type="number"
              value={workoutState.exerciseTimeMs / 1000}
              onChange={(e) =>
                setWorkoutState((prev) => ({
                  ...prev,
                  exerciseTimeMs: Number(e.target.value) * 1000,
                }))
              }
              className="bg-white/5"
              disabled={isRunning}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restTime">Rest Time (seconds)</Label>
            <Input
              id="restTime"
              type="number"
              value={workoutState.restTimeMs / 1000}
              onChange={(e) =>
                setWorkoutState((prev) => ({
                  ...prev,
                  restTimeMs: Number(e.target.value) * 1000,
                }))
              }
              className="bg-white/5"
              disabled={isRunning}
            />
          </div>
        </div>

        <div className="space-y-2">
          {workoutState.exercises.map((exercise, index) => {
            const leftProgress = progress.progressById.get(
              `${exercise.id}-left`,
            );
            const rightProgress = progress.progressById.get(
              `${exercise.id}-right`,
            );

            return (
              <div
                key={exercise.id}
                className={cn(
                  'grid grid-cols-[1fr,2fr,auto] gap-4 items-center p-2',
                  (leftProgress?.state === 'running' ||
                    rightProgress?.state === 'running') &&
                    'bg-blue-500/10 rounded-lg',
                )}
              >
                <div>
                  <Input
                    ref={(el) => (inputRefs.current[index] = el)}
                    id={`exercise-${index}`}
                    value={exercise.name}
                    onChange={(e) => updateExercise(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isRunning) {
                        e.preventDefault();
                        addExercise();
                      }
                    }}
                    placeholder="Exercise name"
                    disabled={isRunning}
                    className="bg-white/5"
                  />
                </div>
                <div className="space-y-1">
                  <div className="relative">
                    <Progress
                      value={(leftProgress?.progressFraction ?? 0) * 100}
                      className="h-6"
                    />
                    <div className="absolute inset-0 flex justify-between items-center px-3">
                      <span className="text-xs text-white/70">Left</span>
                      <span className="text-xs font-medium font-mono">
                        {formatTime(leftProgress?.remainingTimeMs ?? 0)}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <Progress
                      value={(rightProgress?.progressFraction ?? 0) * 100}
                      className="h-6"
                    />
                    <div className="absolute inset-0 flex justify-between items-center px-3">
                      <span className="text-xs text-white/70">Right</span>
                      <span className="text-xs font-medium font-mono">
                        {formatTime(rightProgress?.remainingTimeMs ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExercise(index)}
                  disabled={isRunning || workoutState.exercises.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {!isRunning && (
              <Button
                onClick={addExercise}
                variant="outline"
                disabled={isRunning}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Exercise
              </Button>
            )}

            {Array.from(progress.progressById.values()).some(
              (node: TimerNodeProgress) =>
                node.id.endsWith('-rest') && node.state === 'running',
            ) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  Rest:{' '}
                  {formatTime(
                    Array.from(progress.progressById.values()).find(
                      (node: TimerNodeProgress) =>
                        node.id.endsWith('-rest') && node.state === 'running',
                    )?.remainingTimeMs ?? 0,
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="space-x-2">
            {!isRunning ? (
              <Button
                onClick={startTimer}
                disabled={progress.rootProgress.state === 'finished'}
              >
                <Play className="w-4 h-4 mr-2" />
                Start
              </Button>
            ) : (
              <Button onClick={pauseTimer} variant="secondary">
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}
            <Button onClick={resetTimer} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {progress.rootProgress.state === 'finished' && (
          <div className="text-center text-green-400 font-bold">
            Workout Complete! 🎉
          </div>
        )}
      </Card>
    </div>
  );
}

export default App;
