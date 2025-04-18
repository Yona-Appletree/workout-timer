import { expect, test } from 'vitest';
import { computeElapsedTime } from './computeElapsedTime.ts';

test('not started', () => {
  expect(computeElapsedTime([], 3000)).toBe(0);
});

test('started', () => {
  expect(computeElapsedTime([{ type: 'start', timeMs: 1000 }], 3000)).toBe(
    2000,
  );
});

test('paused', () => {
  expect(
    computeElapsedTime(
      [
        { type: 'start', timeMs: 1000 },
        { type: 'pause', timeMs: 2000 },
      ],
      10000,
    ),
  ).toBe(1000);
});

test('resumed', () => {
  expect(
    computeElapsedTime(
      [
        { type: 'start', timeMs: 1000 },
        { type: 'pause', timeMs: 2000 },
        { type: 'resume', timeMs: 9000 },
      ],
      10000,
    ),
  ).toBe(2000);
});

test('add-time', () => {
  expect(
    computeElapsedTime(
      [
        { type: 'start', timeMs: 1000 },
        { type: 'pause', timeMs: 2000 },
        { type: 'add-time', timeMs: 3000 },
        { type: 'resume', timeMs: 9000 },
        { type: 'add-time', timeMs: 3000 },
      ],
      10000,
    ),
  ).toBe(8000);
});
