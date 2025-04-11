import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Timer, Play, Pause, RotateCcw, Plus, Trash2, Clock } from "lucide-react";
import { cn } from '@/lib/utils';

interface Exercise {
  name: string;
  leftProgress: number;
  rightProgress: number;
}

type TimerState = 'idle' | 'running' | 'completed' | 'resting';

function App() {
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: 'Bicep Curls', leftProgress: 0, rightProgress: 0 }
  ]);
  const [exerciseTime, setExerciseTime] = useState(30);
  const [restTime, setRestTime] = useState(10);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [currentRestTime, setCurrentRestTime] = useState(0);
  
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);

  const addExercise = () => {
    setExercises([...exercises, { name: '', leftProgress: 0, rightProgress: 0 }]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const updatedExercises = exercises.map((exercise, i) => {
      if (i === index) {
        return { ...exercise, [field]: value };
      }
      return exercise;
    });
    setExercises(updatedExercises);
  };

  const formatTime = (seconds: number) => {
    return seconds.toFixed(2) + 's';
  };

  const getRemainingTime = (progress: number) => {
    return (100 - progress) * exerciseTime / 100;
  };

  const updateTimer = (timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
      lastUpdateTimeRef.current = timestamp;
    }

    const deltaTime = (timestamp - lastUpdateTimeRef.current) / 1000;
    lastUpdateTimeRef.current = timestamp;

    if (isRunning && currentExercise < exercises.length) {
      if (timerState === 'resting') {
        setCurrentRestTime(prev => {
          const newTime = Math.max(0, prev - deltaTime);
          if (newTime <= 0) {
            setTimerState('running');
            return restTime;
          }
          return newTime;
        });
      } else {
        setExercises(prev => {
          const newExercises = [...prev];
          const exercise = newExercises[currentExercise];
          const progressIncrement = (deltaTime * 100) / exerciseTime;
          
          if (exercise.leftProgress < 100) {
            exercise.leftProgress = Math.min(100, exercise.leftProgress + progressIncrement);
          } else if (exercise.rightProgress < 100) {
            exercise.rightProgress = Math.min(100, exercise.rightProgress + progressIncrement);
          } else {
            if (currentExercise === exercises.length - 1) {
              setTimerState('completed');
              setIsRunning(false);
              return newExercises;
            } else {
              setCurrentRestTime(restTime);
              setTimerState('resting');
              setCurrentExercise(prev => prev + 1);
            }
          }
          return newExercises;
        });
      }
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    }
  };

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, currentExercise, timerState]);

  const startTimer = () => {
    setTimerState('running');
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsRunning(false);
    setTimerState('idle');
    setCurrentExercise(0);
    setCurrentRestTime(restTime);
    startTimeRef.current = 0;
    setExercises(exercises.map(exercise => ({
      ...exercise,
      leftProgress: 0,
      rightProgress: 0
    })));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <Card className={cn(
        "w-full max-w-2xl p-6 space-y-6 backdrop-blur-lg transition-colors",
        timerState === 'idle' && "bg-black/20",
        timerState === 'running' && "bg-gray-500/20",
        timerState === 'resting' && "bg-blue-500/20",
        timerState === 'completed' && "bg-green-500/20"
      )}>
        <div className="flex items-center justify-center space-x-2">
          <Timer className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-primary">Exercise Timer</h1>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="exerciseTime">Exercise Time (seconds)</Label>
            <Input
              id="exerciseTime"
              type="number"
              value={exerciseTime}
              onChange={(e) => setExerciseTime(Number(e.target.value))}
              className="bg-white/5"
              disabled={isRunning}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restTime">Rest Time (seconds)</Label>
            <Input
              id="restTime"
              type="number"
              value={restTime}
              onChange={(e) => setRestTime(Number(e.target.value))}
              className="bg-white/5"
              disabled={isRunning}
            />
          </div>
        </div>

        {timerState === 'resting' && (
          <div className="text-center p-4 bg-blue-500/10 rounded-lg">
            <Clock className="w-6 h-6 mx-auto mb-2 animate-pulse" />
            <div className="text-xl font-bold">Rest Time: {formatTime(currentRestTime)}</div>
          </div>
        )}

        <div className="space-y-4">
          {exercises.map((exercise, index) => (
            <div key={index} className={cn(
              "grid grid-cols-[1fr,2fr,auto] gap-4 items-center",
              currentExercise === index && timerState === 'running' && "bg-blue-500/10 p-4 rounded-lg"
            )}>
              <div>

                <Input
                  id={`exercise-${index}`}
                  value={exercise.name}
                  onChange={(e) => updateExercise(index, 'name', e.target.value)}
                  placeholder="Exercise name"
                  disabled={isRunning}
                  className="bg-white/5"
                />
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Progress value={exercise.leftProgress} className="h-6" />
                  <div className="absolute inset-0 flex justify-between items-center px-3">
                    <span className="text-xs text-white/70">Left</span>
                    <span className="text-xs font-medium font-mono">
                      {formatTime(getRemainingTime(exercise.leftProgress))}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={exercise.rightProgress} className="h-6" />
                  <div className="absolute inset-0 flex justify-between items-center px-3">
                    <span className="text-xs text-white/70">Right</span>
                    <span className="text-xs font-medium font-mono">
                      {formatTime(getRemainingTime(exercise.rightProgress))}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeExercise(index)}
                disabled={isRunning || exercises.length === 1}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <Button
            onClick={addExercise}
            variant="outline"
            disabled={isRunning}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Exercise
          </Button>

          <div className="space-x-2">
            {!isRunning ? (
              <Button onClick={startTimer} disabled={timerState === 'completed'}>
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

        {timerState === 'completed' && (
          <div className="text-center text-green-400 font-bold">
            Workout Complete! 🎉
          </div>
        )}
      </Card>
    </div>
  );
}

export default App;