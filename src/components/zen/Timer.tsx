import React, { useState, useEffect, useRef } from 'react';

type TimerMode = 'focus' | 'break';

const Timer: React.FC = () => {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const focusTime = 25 * 60;
  const breakTime = 5 * 60;

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            // Switch mode and reset time
            const newMode = mode === 'focus' ? 'break' : 'focus';
            setMode(newMode);
            setTimeLeft(newMode === 'focus' ? focusTime : breakTime);
            // Play notification sound (optional)
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, mode]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setMode('focus');
    setTimeLeft(focusTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-light mb-6 text-green-700 dark:text-green-300">工作计时器</h2>

      {/* Timer Display */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="text-5xl font-light mb-3 text-green-700 dark:text-green-300">
          {formatTime(timeLeft)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {mode === 'focus' ? '专注时间' : '休息时间'}
        </div>
      </div>

      {/* Mode Selection */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => {
            setIsRunning(false);
            setMode('focus');
            setTimeLeft(focusTime);
          }}
          className={`flex-1 py-2 rounded-full text-sm transition-all ${mode === 'focus' ? 'bg-green-600 text-white' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'}`}
        >
          专注 (25分钟)
        </button>
        <button
          onClick={() => {
            setIsRunning(false);
            setMode('break');
            setTimeLeft(breakTime);
          }}
          className={`flex-1 py-2 rounded-full text-sm transition-all ${mode === 'break' ? 'bg-blue-600 text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'}`}
        >
          休息 (5分钟)
        </button>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={toggleTimer}
          className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full transition-all duration-300 shadow-sm hover:shadow"
        >
          {isRunning ? '暂停' : '开始'}
        </button>
        <button
          onClick={resetTimer}
          className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-all duration-300"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Timer;