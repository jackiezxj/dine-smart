import React, { useState, useRef, useEffect } from 'react';

interface NoiseOption {
  id: string;
  name: string;
  icon: string;
}

const WhiteNoiseSelector: React.FC = () => {
  const [selectedNoise, setSelectedNoise] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const noiseOptions: NoiseOption[] = [
    { id: 'rain', name: '雨声', icon: '🌧️' },
    { id: 'forest', name: '森林', icon: '🌲' },
    { id: 'waves', name: '海浪', icon: '🌊' },
    { id: 'birds', name: '鸟鸣', icon: '🐦' },
    { id: 'fire', name: '炉火', icon: '🔥' },
    { id: 'wind', name: '风声', icon: '💨' }
  ];

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, []);

  // Update volume for all audio elements
  useEffect(() => {
    Object.values(audioRefs.current).forEach(audio => {
      audio.volume = volume / 100;
    });
  }, [volume]);

  const toggleNoise = (noiseId: string) => {
    if (selectedNoise === noiseId) {
      // Stop current noise
      if (audioRefs.current[noiseId]) {
        audioRefs.current[noiseId].pause();
        audioRefs.current[noiseId].currentTime = 0;
      }
      setSelectedNoise(null);
    } else {
      // Stop previous noise
      if (selectedNoise && audioRefs.current[selectedNoise]) {
        audioRefs.current[selectedNoise].pause();
        audioRefs.current[selectedNoise].currentTime = 0;
      }
      
      // Start new noise
      let audio = audioRefs.current[noiseId];
      if (!audio) {
        // In a real app, you would use actual audio files
        // For demo purposes, we'll just create a silent audio element
        audio = new Audio();
        audio.loop = true;
        audio.volume = volume / 100;
        audioRefs.current[noiseId] = audio;
      }
      
      // In a real app, you would set the src and play
      // audio.src = `/sounds/${noiseId}.mp3`;
      // audio.play().catch(e => console.error(e));
      
      setSelectedNoise(noiseId);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-light mb-6 text-green-700 dark:text-green-300">背景白噪音</h2>

      {/* Noise Options */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {noiseOptions.map(noise => (
          <button
            key={noise.id}
            onClick={() => toggleNoise(noise.id)}
            className={`p-4 rounded-xl text-center transition-all duration-300 ${selectedNoise === noise.id ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
          >
            <div className="text-2xl mb-2">{noise.icon}</div>
            <div className="text-sm">{noise.name}</div>
          </button>
        ))}
      </div>

      {/* Volume Control */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>音量</span>
          <span>{volume}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
        />
      </div>
    </div>
  );
};

export default WhiteNoiseSelector;