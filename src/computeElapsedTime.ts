export function computeElapsedTime(
  events: Array<TimerEvent>,
  nowMs = Date.now(),
): number {
  let timeElapsedMs = 0;
  let lastPauseTimeMs: number | null = null;
  let lastStartTimeMs: number | null = null;

  for (const event of events) {
    if (event.type === 'start') {
      lastStartTimeMs = event.timeMs;
    } else if (event.type === 'pause' && lastStartTimeMs !== null) {
      timeElapsedMs += event.timeMs - lastStartTimeMs;
      lastPauseTimeMs = event.timeMs;
      lastStartTimeMs = null;
    } else if (event.type === 'resume' && lastPauseTimeMs !== null) {
      lastStartTimeMs = event.timeMs;
      lastPauseTimeMs = null;
    } else if (event.type === 'add-time') {
      timeElapsedMs += event.timeMs;
    }
  }

  if (lastPauseTimeMs == null && lastStartTimeMs !== null) {
    timeElapsedMs += nowMs - lastStartTimeMs;
  }

  return timeElapsedMs;
}

export type TimerEvent =
  | {
      type: 'start';
      timeMs: number;
    }
  | {
      type: 'pause';
      timeMs: number;
    }
  | {
      type: 'resume';
      timeMs: number;
    }
  | {
      type: 'add-time';
      timeMs: number;
    };
