import React, { useState, useRef } from 'react';
import { generateImage } from '../../lib/aiImageService';

interface AIImageGeneratorProps {
  isDarkMode: boolean;
}

const AIImageGenerator: React.FC<AIImageGeneratorProps> = ({ isDarkMode }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.length > 30) {
      setError('请输入1-30个字的描述');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const imageUrl = await generateImage(prompt.trim());
      setGeneratedImage(imageUrl);
    } catch (err) {
      setError('图片生成失败，请重试');
      console.error('图片生成错误:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage && imageRef.current) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `zen-image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-light mb-6 text-green-700 dark:text-green-300">AI禅意画生成</h2>

      {/* Input Section */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="输入一句话描述（1-30字）..."
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setError(null);
          }}
          maxLength={30}
          className={`w-full px-4 py-3 rounded-full border ${isDarkMode ? 'border-green-800 bg-gray-700' : 'border-green-200 bg-green-50'} focus:outline-none focus:ring-2 focus:ring-green-300 dark:focus:ring-green-600 transition-all mb-2`}
        />
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>{prompt.length}/30</span>
          {error && <span className="text-red-500 dark:text-red-400">{error}</span>}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className={`w-full py-3 rounded-full transition-all duration-300 shadow-sm hover:shadow ${isGenerating || !prompt.trim() ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
      >
        {isGenerating ? '生成中...' : '生成禅意画'}
      </button>

      {/* Image Display */}
      {generatedImage && (
        <div className="mt-6">
          <div className="relative rounded-xl overflow-hidden shadow-md bg-gray-100 dark:bg-gray-700">
            <img
              ref={imageRef}
              src={generatedImage}
              alt="生成的禅意画"
              className="w-full aspect-[9/16] object-cover cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
              onClick={handleDownload}
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity duration-300">
              <div className="text-white text-center">
                <div className="text-lg font-medium mb-1">点击下载</div>
                <div className="text-sm">9:16 禅意画</div>
              </div>
            </div>
          </div>

          {/* Regenerate Button */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`px-6 py-2 rounded-full transition-all duration-300 shadow-sm hover:shadow ${isGenerating ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {isGenerating ? '生成中...' : '重新生成'}
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
        <h3 className="text-sm font-medium text-green-700 dark:text-green-300 mb-3">生成说明</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
          <li>• 输入1-30字的描述</li>
          <li>• 生成具有东方禅意的9:16长图</li>
          <li>• 点击图片可下载</li>
          <li>• 可多次生成直到满意</li>
        </ul>
      </div>
    </div>
  );
};

export default AIImageGenerator;