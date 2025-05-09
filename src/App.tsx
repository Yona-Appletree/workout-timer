import { ExerciseProgress } from '@/components/ExerciseProgress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  FastForward,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Timer,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
  betweenSidesRestTimeMs: number,
) => {
  // Format: exerciseTimeSec,restTimeSec,betweenSidesRestTimeSec|exercise1Name|exercise2Name|...
  const exerciseNames = exercises
    .map((ex) => encodeURIComponent(ex.name))
    .join('|');
  return `${Math.round(exerciseTimeMs / 1000)},${Math.round(restTimeMs / 1000)},${Math.round(betweenSidesRestTimeMs / 1000)}|${exerciseNames}`;
};

const decodeState = (encoded: string) => {
  try {
    const [times, ...exerciseNames] = encoded.split('|');
    const [exerciseTimeSec, restTimeSec, betweenSidesRestTimeSec = 0] = times
      .split(',')
      .map(Number);

    if (isNaN(exerciseTimeSec) || isNaN(restTimeSec)) {
      return null;
    }

    const exercises = exerciseNames.map((name) =>
      createExercise(decodeURIComponent(name)),
    );

    return {
      exercises,
      exerciseTimeMs: exerciseTimeSec * 1000,
      restTimeMs: restTimeSec * 1000,
      betweenSidesRestTimeMs: betweenSidesRestTimeSec * 1000,
    };
  } catch (error) {
    console.error('Failed to decode state:', error);
    return null;
  }
};

// Local storage key
const STORAGE_KEY = 'workout-timer-state';

function App() {
  const [workoutState, setWorkoutState] = useState<WorkoutState>(() => {
    // First try to load from URL
    const params = new URLSearchParams(window.location.search);
    const encodedState = params.get('state');
    if (encodedState) {
      const decoded = decodeState(encodedState);
      if (decoded) {
        return createWorkoutState(
          decoded.exercises,
          decoded.exerciseTimeMs,
          decoded.restTimeMs,
          decoded.betweenSidesRestTimeMs,
        );
      }
    }

    // Fallback to local storage
    const storedState = localStorage.getItem(STORAGE_KEY);
    if (storedState) {
      const decoded = decodeState(storedState);
      if (decoded) {
        return createWorkoutState(
          decoded.exercises,
          decoded.exerciseTimeMs,
          decoded.restTimeMs,
          decoded.betweenSidesRestTimeMs,
        );
      }
    }

    // Default state
    const defaultDecoded = decodeState(
      '90,5,5|Hurdle|High%20leg%20lunge|Splits',
    );
    if (defaultDecoded) {
      return createWorkoutState(
        defaultDecoded.exercises,
        defaultDecoded.exerciseTimeMs,
        defaultDecoded.restTimeMs,
        defaultDecoded.betweenSidesRestTimeMs,
      );
    }

    // Fallback to a basic state if decoding fails
    return createWorkoutState(
      [createExercise('Exercise 1')],
      30 * 1000, // 30 seconds
      10 * 1000, // 10 seconds
      5 * 1000, // 5 seconds
    );
  });

  const progress = computeWorkoutProgress(workoutState);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isStarted = workoutState.events.length > 0;
  const isPaused =
    workoutState.events.length > 0 &&
    workoutState.events.filter((it) => it.type != 'add-time').at(-1)?.type ===
      'pause';

  // Update progress while timer is running
  useEffect(() => {
    if (!isStarted) return;

    let animationFrameId: number;
    const updateProgress = () => {
      animationFrameId = requestAnimationFrame(updateProgress);
      // force a re-render
      setWorkoutState((prev) => ({ ...prev }));
    };
    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isStarted, workoutState]);

  // Update URL and local storage when state changes
  useEffect(() => {
    const encoded = encodeState(
      workoutState.exercises,
      workoutState.exerciseTimeMs,
      workoutState.restTimeMs,
      workoutState.betweenSidesRestTimeMs,
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
    workoutState.betweenSidesRestTimeMs,
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

  const startTimer = () => {
    const now = Date.now();
    setWorkoutState((prev) => ({
      ...prev,
      events: [...prev.events, { type: 'start', timeMs: now }],
    }));
  };

  const pauseTimer = () => {
    const now = Date.now();
    setWorkoutState((prev) => ({
      ...prev,
      events: [
        ...prev.events,
        { type: isPaused ? 'resume' : 'pause', timeMs: now },
      ],
    }));
  };

  const resetTimer = () => {
    const newState = {
      ...workoutState,
      events: [],
    };
    setWorkoutState(newState);
  };

  const skipCurrentTimer = () => {
    if (progress.currentNodeId) {
      const currentNode = progress.progressById.get(progress.currentNodeId);
      if (currentNode) {
        const newState = {
          ...workoutState,
          events: [
            ...workoutState.events,
            {
              type: 'add-time' as const,
              // Add a tiny bit of time to ensure we are in the next node, not in-between nodes
              timeMs: currentNode.remainingTimeMs + 0.001,
            },
          ],
        };
        setWorkoutState(newState);
      }
    }
  };

  const resetCurrentExercise = () => {
    if (progress.currentNodeId) {
      const currentNode = progress.progressById.get(progress.currentNodeId);
      if (currentNode) {
        const newState = {
          ...workoutState,
          events: [
            ...workoutState.events,
            {
              type: 'add-time' as const,
              // Add negative time equal to elapsed time to reset the current exercise
              timeMs: -(currentNode.timeElapsedMs + 0.001),
            },
          ],
        };
        setWorkoutState(newState);
      }
    }
  };

  const isRunning = progress.rootProgress.state === 'running';

  return (
    <div
      className="
      min-h-screen bg-gradient-to-br from-gray-900
      to-gray-800 text-white flex flex-col items-center justify-center p-4
    "
    >
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
              disabled={isStarted}
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
              disabled={isStarted}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="betweenSidesRestTime">
              Between Sides Rest (seconds)
            </Label>
            <Input
              id="betweenSidesRestTime"
              type="number"
              value={workoutState.betweenSidesRestTimeMs / 1000}
              onChange={(e) =>
                setWorkoutState((prev) => ({
                  ...prev,
                  betweenSidesRestTimeMs: Number(e.target.value) * 1000,
                }))
              }
              className="bg-white/5"
              disabled={isStarted}
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
            const restProgress = progress.progressById.get(
              `${exercise.id}-rest`,
            );
            const betweenSidesProgress = progress.progressById.get(
              `${exercise.id}-between-sides`,
            );

            return (
              <>
                <div
                  className={cn(
                    'flex flex-col md:grid md:grid-cols-[1fr,2fr] gap-4 items-center p-2',
                    (leftProgress?.state === 'running' ||
                      rightProgress?.state === 'running') &&
                      'bg-blue-500/10 rounded-lg',
                  )}
                >
                  <div className="w-full md:w-auto flex items-center gap-2">
                    {isStarted ? (
                      <div className="text-xl text-white text-center md:text-left flex-1">
                        {exercise.name}
                      </div>
                    ) : (
                      <>
                        <Input
                          ref={(el) => (inputRefs.current[index] = el)}
                          id={`exercise-${index}`}
                          value={exercise.name}
                          onChange={(e) =>
                            updateExercise(index, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isStarted) {
                              e.preventDefault();
                              addExercise();
                            }
                          }}
                          placeholder="Exercise name"
                          disabled={isStarted}
                          className="bg-white/5 flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExercise(index)}
                          disabled={workoutState.exercises.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="space-y-1 w-full md:w-auto">
                    <ExerciseProgress label="Left" progress={leftProgress} />
                    {workoutState.betweenSidesRestTimeMs > 0 && (
                      <ExerciseProgress
                        label="Switch Sides"
                        progress={betweenSidesProgress}
                        className={cn(
                          'transition-opacity duration-200',
                          betweenSidesProgress?.state === 'running' &&
                            'bg-blue-500/10 rounded-lg p-1',
                        )}
                      />
                    )}
                    <ExerciseProgress label="Right" progress={rightProgress} />
                  </div>
                </div>

                {/*********************************************************/}
                {/* Rest */}
                {index < workoutState.exercises.length - 1 && (
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      restProgress?.state === 'running' && 'bg-blue-500/10',
                    )}
                  >
                    <ExerciseProgress
                      label="Rest"
                      progress={restProgress}
                      className="w-full"
                    />
                  </div>
                )}
              </>
            );
          })}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 justify-between items-center gap-2">
          {isStarted ? (
            isRunning ? (
              <>
                <Button onClick={resetCurrentExercise} variant="secondary">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Redo
                </Button>
                <Button onClick={skipCurrentTimer} variant="secondary">
                  <FastForward className="w-4 h-4 mr-2" />
                  Skip
                </Button>
              </>
            ) : (
              <div className="text-center text-green-400 font-bold">
                Workout Complete! 🎉
              </div>
            )
          ) : (
            <>
              <Button
                onClick={addExercise}
                variant="outline"
                disabled={isStarted}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Exercise
              </Button>
              <Button
                onClick={startTimer}
                disabled={progress.rootProgress.state === 'finished'}
              >
                <Play className="w-4 h-4 mr-2" />
                Start
              </Button>
            </>
          )}

          {isStarted ? (
            <>
              {isRunning && (
                <Button onClick={pauseTimer} variant="secondary">
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  )}
                </Button>
              )}

              <Button onClick={resetTimer} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </>
          ) : null}
        </div>
      </Card>
      <div className="text-sm text-white/50 font-['Dancing_Script'] text-right mt-4">
        <a href="https://www.photomancer.art" target="_blank">
          Made with ❤️ by Hypher
        </a>
      </div>
    </div>
  );
}

export default App;
