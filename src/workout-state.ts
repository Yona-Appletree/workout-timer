import { computeElapsedTime, TimerEvent } from './computeElapsedTime';
import {
  computeTreeTimerProgress,
  TreeTimerNode,
  TreeTimerProgress,
} from './tree-timer';

export interface Exercise {
  name: string;
  id: string;
}

export interface WorkoutState {
  exercises: Exercise[];
  exerciseTimeMs: number;
  restTimeMs: number;
  events: TimerEvent[];
}

export function buildWorkoutTree(
  exercises: Exercise[],
  exerciseTimeMs: number,
  restTimeMs: number,
): TreeTimerNode {
  return {
    id: 'workout',
    type: 'branch',
    children: exercises.flatMap((exercise, index) => [
      // Left side of exercise
      {
        id: `${exercise.id}-left`,
        type: 'leaf' as const,
        durationMs: exerciseTimeMs,
      },
      // Right side of exercise
      {
        id: `${exercise.id}-right`,
        type: 'leaf' as const,
        durationMs: exerciseTimeMs,
      },
      // Rest period (except after last exercise)
      ...(index < exercises.length - 1
        ? [
            {
              id: `${exercise.id}-rest`,
              type: 'leaf' as const,
              durationMs: restTimeMs,
            },
          ]
        : []),
    ]),
  };
}

export function computeWorkoutProgress(
  state: WorkoutState,
  nowMs = Date.now(),
): TreeTimerProgress {
  const tree = buildWorkoutTree(
    state.exercises,
    state.exerciseTimeMs,
    state.restTimeMs,
  );
  const elapsedTimeMs = computeElapsedTime(state.events, nowMs);
  return computeTreeTimerProgress(tree, elapsedTimeMs);
}

export function createExercise(name: string): Exercise {
  return {
    name,
    id: crypto.randomUUID(),
  };
}

export function createWorkoutState(
  exercises: Exercise[],
  exerciseTimeMs: number,
  restTimeMs: number,
): WorkoutState {
  return {
    exercises,
    exerciseTimeMs,
    restTimeMs,
    events: [],
  };
}
