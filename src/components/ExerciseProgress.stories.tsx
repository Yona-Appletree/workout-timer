import type { Meta, StoryObj } from '@storybook/react';
import { ExerciseProgress } from './ExerciseProgress';

const meta: Meta<typeof ExerciseProgress> = {
  title: 'Components/ExerciseProgress',
  component: ExerciseProgress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ExerciseProgress>;

export const Default: Story = {
  args: {
    label: 'Exercise 1',
    progress: {
      id: 'exercise-1',
      progressFraction: 0.5,
      timeElapsedMs: 30000,
      remainingTimeMs: 30000,
      totalTimeMs: 60000,
      state: 'running',
    },
  },
};

export const NoProgress: Story = {
  args: {
    label: 'Exercise 2',
    progress: undefined,
  },
};

export const Complete: Story = {
  args: {
    label: 'Exercise 3',
    progress: {
      id: 'exercise-3',
      progressFraction: 1,
      timeElapsedMs: 60000,
      remainingTimeMs: 0,
      totalTimeMs: 60000,
      state: 'finished',
    },
  },
};

export const CustomStyle: Story = {
  args: {
    label: 'Custom Style',
    progress: {
      id: 'custom-1',
      timeElapsedMs: 45000,
      remainingTimeMs: 15000,
      totalTimeMs: 60000,
      progressFraction: 0.75,
      state: 'running',
    },
    className: 'w-96', // Wider progress bar
  },
};
