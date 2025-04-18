export function computeTreeTimerProgress(
  root: TreeTimerNode,
  overallTimeElapsedMs: number,
): TreeTimerProgress {
  function buildProgress(
    node: TreeTimerNode,
    prevDurationMs: number,
  ): TreeTimerProgress {
    switch (node.type) {
      case 'leaf': {
        const timeElapsedMs =
          overallTimeElapsedMs > prevDurationMs
            ? Math.min(overallTimeElapsedMs - prevDurationMs, node.durationMs)
            : 0;
        return {
          id: node.id,
          timeElapsedMs,
          remainingTimeMs: node.durationMs - timeElapsedMs,
          totalTimeMs: node.durationMs,
          progressFraction: timeElapsedMs / node.durationMs,
          state:
            timeElapsedMs === 0
              ? 'not-started'
              : timeElapsedMs === node.durationMs
                ? 'finished'
                : 'running',
        };
      }

      case 'branch': {
        const childrenProgress = [];
        let childrenDurationMs = 0;
        for (const child of node.children) {
          const childProgress = buildProgress(
            child,
            prevDurationMs + childrenDurationMs,
          );
          childrenDurationMs += childProgress.totalTimeMs;
          childrenProgress.push(childProgress);
        }

        const timeElapsedMs =
          overallTimeElapsedMs > prevDurationMs
            ? Math.min(
                overallTimeElapsedMs - prevDurationMs,
                childrenDurationMs,
              )
            : 0;

        return {
          id: node.id,
          timeElapsedMs,
          remainingTimeMs: childrenDurationMs - timeElapsedMs,
          totalTimeMs: childrenDurationMs,
          progressFraction: timeElapsedMs / childrenDurationMs,
          state:
            timeElapsedMs === 0
              ? 'not-started'
              : timeElapsedMs === childrenDurationMs
                ? 'finished'
                : 'running',
          children: childrenProgress,
        };
      }

      default:
        throw new Error(`Unknown node type: ${(node as TreeTimerNode).type}`);
    }
  }

  return buildProgress(root, 0);
}

export type TreeTimerNode = { id: string } & (
  | { type: 'leaf'; durationMs: number }
  | { type: 'branch'; children: Array<TreeTimerNode> }
);

export interface TreeTimerProgress {
  id: string;

  timeElapsedMs: number;
  remainingTimeMs: number;
  totalTimeMs: number;
  progressFraction: number;

  state: 'not-started' | 'running' | 'finished';
  children?: Array<TreeTimerProgress>;
}
