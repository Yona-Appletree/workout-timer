export function WorkoutController(model: WorkoutModel) {}

export interface WorkoutController {
  model: WorkoutModel;
  overallProgress: TimerProgress;
  exercises: Array<{
    progress: TimerProgress;
    steps: Array<{
      progress: TimerProgress;
    }>;
  }>;

  get availableActions(): Array<{
    label: string;
    icon: string;
    activate: () => void;
  }>;
}

export interface WorkoutModel {
  name: string;
  restTime: number;
  exercises: ExerciseModel[];
  defaultExercise?: {
    steps: ExerciseStepModel[];
    restTime: number;
  };
}

export interface ExerciseModel {
  name: string;
  steps?: ExerciseStepModel[];
  restTime?: number;
}

export interface ExerciseStepModel {
  name: string;
  durationMs: number;
}
