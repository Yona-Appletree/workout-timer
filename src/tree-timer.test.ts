import { describe, expect, test } from 'vitest';
import {
  computeTreeTimerProgress,
  TreeTimerNode,
  TreeTimerProgress,
} from './tree-timer';

describe('single node', () => {
  test('zero', () => {
    expect(computeTreeTimerProgress(tree, 0)).toEqual({
      id: '1',
      timeElapsedMs: 0,
      remainingTimeMs: 1000,
      totalTimeMs: 1000,
      progressFraction: 0,
      state: 'not-started',
    } satisfies TreeTimerProgress);
  });

  test('30%', () => {
    expect(computeTreeTimerProgress(tree, 300)).toEqual({
      id: '1',
      timeElapsedMs: 300,
      remainingTimeMs: 700,
      totalTimeMs: 1000,
      progressFraction: 0.3,
      state: 'running',
    } satisfies TreeTimerProgress);
  });

  test('100%', () => {
    expect(computeTreeTimerProgress(tree, 1000)).toEqual({
      id: '1',
      timeElapsedMs: 1000,
      remainingTimeMs: 0,
      totalTimeMs: 1000,
      progressFraction: 1,
      state: 'finished',
    } satisfies TreeTimerProgress);
  });

  const tree: TreeTimerNode = {
    id: '1',
    type: 'leaf',
    durationMs: 1000,
  };
});

describe('tree', () => {
  test('zero', () => {
    expect(computeTreeTimerProgress(tree, 0)).toEqual({
      id: '1',
      timeElapsedMs: 0,
      remainingTimeMs: 3000,
      totalTimeMs: 3000,
      progressFraction: 0,
      state: 'not-started',
      children: [
        {
          id: '2',
          timeElapsedMs: 0,
          remainingTimeMs: 1000,
          totalTimeMs: 1000,
          progressFraction: 0,
          state: 'not-started',
        },
        {
          id: '3',
          timeElapsedMs: 0,
          remainingTimeMs: 2000,
          totalTimeMs: 2000,
          progressFraction: 0,
          state: 'not-started',
        },
      ],
    } satisfies TreeTimerProgress);
  });

  test('600ms', () => {
    expect(computeTreeTimerProgress(tree, 600)).toEqual({
      id: '1',
      timeElapsedMs: 600,
      remainingTimeMs: 2400,
      totalTimeMs: 3000,
      progressFraction: 600 / 3000,
      state: 'running',
      children: [
        {
          id: '2',
          timeElapsedMs: 600,
          remainingTimeMs: 400,
          totalTimeMs: 1000,
          progressFraction: 600 / 1000,
          state: 'running',
        },
        {
          id: '3',
          timeElapsedMs: 0,
          remainingTimeMs: 2000,
          totalTimeMs: 2000,
          progressFraction: 0,
          state: 'not-started',
        },
      ],
    } satisfies TreeTimerProgress);
  });

  test('1200ms', () => {
    const elapsedMs = 1200;
    expect(computeTreeTimerProgress(tree, elapsedMs)).toEqual({
      id: '1',
      timeElapsedMs: elapsedMs,
      remainingTimeMs: 3000 - elapsedMs,
      totalTimeMs: 3000,
      progressFraction: elapsedMs / 3000,
      state: 'running',
      children: [
        {
          id: '2',
          timeElapsedMs: 1000,
          remainingTimeMs: 0,
          totalTimeMs: 1000,
          progressFraction: 1,
          state: 'finished',
        },
        {
          id: '3',
          timeElapsedMs: elapsedMs - 1000,
          remainingTimeMs: 2000 - (elapsedMs - 1000),
          totalTimeMs: 2000,
          progressFraction: (elapsedMs - 1000) / 2000,
          state: 'running',
        },
      ],
    } satisfies TreeTimerProgress);
  });

  test('3500ms', () => {
    const elapsedMs = 3500;
    expect(computeTreeTimerProgress(tree, elapsedMs)).toEqual(
      progressForElapsedMs(elapsedMs),
    );
  });

  function progressForElapsedMs(elapsedMs: number) {
    return {
      id: '1',
      timeElapsedMs: Math.min(elapsedMs, 3000),
      remainingTimeMs: Math.max(0, 3000 - elapsedMs),
      totalTimeMs: 3000,
      progressFraction: Math.min(elapsedMs / 3000, 1),
      state:
        elapsedMs > 0
          ? elapsedMs >= 3000
            ? 'finished'
            : 'running'
          : 'not-started',
      children: [
        {
          id: '2',
          timeElapsedMs: Math.min(elapsedMs, 1000),
          remainingTimeMs: 1000 - Math.min(elapsedMs, 1000),
          totalTimeMs: 1000,
          progressFraction: Math.min(elapsedMs, 1000) / 1000,
          state:
            elapsedMs >= 1000
              ? 'finished'
              : elapsedMs > 0
                ? 'running'
                : 'not-started',
        },
        {
          id: '3',
          timeElapsedMs: Math.min(elapsedMs - 1000, 2000),
          remainingTimeMs: 2000 - Math.min(elapsedMs - 1000, 2000),
          totalTimeMs: 2000,
          progressFraction: Math.min(elapsedMs - 1000, 2000) / 2000,
          state:
            elapsedMs >= 3000
              ? 'finished'
              : elapsedMs > 1000
                ? 'running'
                : 'not-started',
        },
      ],
    } satisfies TreeTimerProgress;
  }

  const tree: TreeTimerNode = {
    id: '1',
    type: 'branch',
    children: [
      {
        id: '2',
        type: 'leaf',
        durationMs: 1000,
      },
      {
        id: '3',
        type: 'leaf',
        durationMs: 2000,
      },
    ],
  };
});
