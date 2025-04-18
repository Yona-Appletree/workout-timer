import { Progress } from '@/components/ui/progress';
import { TimerNodeProgress } from '@/tree-timer';

interface ExerciseProgressProps {
  label: string;
  progress: TimerNodeProgress | undefined;
  className?: string;
}

export function ExerciseProgress({
  label,
  progress,
  className,
}: ExerciseProgressProps) {
  return (
    <div className={className}>
      <div className="relative">
        <Progress
          value={(progress?.progressFraction ?? 0) * 100}
          className="h-6"
        />
        <div className="absolute inset-0 flex justify-between items-center px-3">
          <span className="text-xs font-bold text-white/70">{label}</span>
          <span className="text-xs font-medium font-mono">
            {formatTime(progress?.timeElapsedMs ?? 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatTime(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const remainingMs = Math.round(ms % 1000);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
    .toString()
    .padStart(2, '0')}.${remainingMs.toString().padStart(3, '0')}`;
}
