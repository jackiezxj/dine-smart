import React, { useState, useEffect, useRef } from 'react';

type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'pause';

const BreathingGuide: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathingPhase>('inhale');
  const [progress, setProgress] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(5); // minutes
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionRef = useRef<NodeJS.Timeout | null>(null);

  // Breathing cycle: 4s inhale, 4s hold, 6s exhale, 2s pause
  const breathingCycle = [
    { phase: 'inhale' as const, duration: 4, label: '吸气', color: 'bg-green-400' },
    { phase: 'hold' as const, duration: 4, label: '屏息', color: 'bg-blue-400' },
    { phase: 'exhale' as const, duration: 6, label: '呼气', color: 'bg-purple-400' },
    { phase: 'pause' as const, duration: 2, label: '暂停', color: 'bg-gray-400' }
  ];

  const totalCycleDuration = breathingCycle.reduce((sum, step) => sum + step.duration, 0);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);

  useEffect(() => {
    if (isActive) {
      // Start session timer
      setRemainingTime(sessionDuration * 60);
      sessionRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(sessionRef.current!);
            clearInterval(intervalRef.current!);
            setIsActive(false);
            setProgress(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start breathing cycle
      startBreathingCycle();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (sessionRef.current) {
        clearInterval(sessionRef.current);
      }
      setPhase('inhale');
      setCurrentStep(0);
      setStepProgress(0);
      setProgress(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (sessionRef.current) {
        clearInterval(sessionRef.current);
      }
    };
  }, [isActive, sessionDuration]);

  const startBreathingCycle = () => {
    const step = breathingCycle[currentStep];
    setPhase(step.phase);
    setStepProgress(0);
    let elapsed = 0;

    intervalRef.current = setInterval(() => {
      elapsed += 0.1;
      const newProgress = Math.min(100, (elapsed / step.duration) * 100);
      setStepProgress(newProgress);

      if (elapsed >= step.duration) {
        clearInterval(intervalRef.current!);
        const nextStep = (currentStep + 1) % breathingCycle.length;
        setCurrentStep(nextStep);
        startBreathingCycle();
      }
    }, 100);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-light mb-6 text-green-700 dark:text-green-300">呼吸引导</h2>

      {/* Session Duration */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>冥想时长</span>
          <span>{sessionDuration}分钟</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={sessionDuration}
          onChange={(e) => setSessionDuration(Number(e.target.value))}
          disabled={isActive}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
        />
      </div>

      {/* Breathing Circle */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="relative w-40 h-40 mb-6">
          {/* Progress Circle */}
          <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="10"
            />
            {/* Progress Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={
                phase === 'inhale' ? '#4ade80' :
                phase === 'hold' ? '#60a5fa' :
                phase === 'exhale' ? '#a78bfa' : '#9ca3af'
              }
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="283"
              strokeDashoffset={283 - (stepProgress / 100) * 283}
              className="transition-all duration-100"
            />
          </svg>
          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-light mb-2">
              {breathingCycle[currentStep].icon || '🌬️'}
            </div>
            <div className="text-lg font-medium">
              {breathingCycle[currentStep].label}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {Math.round(breathingCycle[currentStep].duration - (stepProgress / 100) * breathingCycle[currentStep].duration)}s
            </div>
          </div>
        </div>

        {/* Remaining Time */}
        {isActive && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            剩余时间: {formatTime(remainingTime)}
          </div>
        )}
      </div>

      {/* Controls */}
      <button
        onClick={() => setIsActive(!isActive)}
        className={`w-full py-3 rounded-full transition-all duration-300 shadow-sm hover:shadow ${isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
      >
        {isActive ? '结束冥想' : '开始冥想'}
      </button>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
        <h3 className="text-sm font-medium text-green-700 dark:text-green-300 mb-3">呼吸指导</h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span>吸气 4秒</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
            <span>屏息 4秒</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-400"></div>
            <span>呼气 6秒</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span>暂停 2秒</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreathingGuide;