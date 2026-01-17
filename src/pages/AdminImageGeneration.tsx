import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateImage as generateAIImage } from '@/lib/aiImageService';
import { Helmet } from 'react-helmet-async';

// 添加阿里云API类型定义
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default function AdminImageGeneration() {
  const navigate = useNavigate();
  
  // 状态管理
  const [description, setDescription] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 生成图片的函数
  const generateImage = async () => {
    if (!description.trim()) {
      setErrorMessage('请输入美食描述');
      return;
    }
    
    if (description.length > 30) {
      setErrorMessage('描述不能超过30字');
      return;
    }
    
    setIsGenerating(true);
    setErrorMessage(null);
    
    try {
      // 直接调用AI图片生成服务
      const imageUrl = await generateAIImage(description);
      
      // 成功生成图片
      if (imageUrl) {
        setGeneratedImage(imageUrl);
        
        // 上报GA事件
        if (window.gtag) {
          window.gtag('event', 'image_generated', {
            'event_category': 'admin_interaction',
            'event_label': 'food_image_generation',
            'value': 1,
            'description': description
          });
        }
      } else {
        setErrorMessage('生成图片失败，请重试');
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setErrorMessage('生成图片失败，请检查网络连接并重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 下载图片的函数
  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `food_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 上报GA事件
    if (window.gtag) {
      window.gtag('event', 'image_downloaded', {
        'event_category': 'admin_interaction',
        'event_label': 'food_image_download',
        'value': 1
      });
    }
  };

  // 返回上一页
  const handleBack = () => {
    navigate('/admin');
  };

  return (
    <>
      <Helmet>
        <title>管理员后台 - 图片生成</title>
        <meta name="description" content="管理员后台，用于生成美食图片" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* 头部导航 */}
        <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleBack} 
                className="text-gray-500 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">生成美食图片</h1>
            </div>
          </div>
        </header>

        {/* 主要内容 */}
        <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
          {/* 输入区域 */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">美食描述</h2>
            <div className="space-y-3">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请输入美食描述（30字以内），例如：酥脆的炸鸡配薯条"
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                rows={3}
                maxLength={30}
              />
              <div className="text-right text-sm text-gray-500">
                {description.length}/30
              </div>
              {errorMessage && (
                <div className="text-red-500 text-sm">
                  {errorMessage}
                </div>
              )}
              <button
                    onClick={generateImage}
                    disabled={isGenerating || !description.trim()}
                    className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    生成中...
                  </>
                ) : (
                  '生成图片'
                )}
              </button>
            </div>
          </div>

          {/* 图片展示区域 */}
          {generatedImage && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">生成的图片</h2>
              <div className="space-y-4">
                {/* 图片展示 */}
                <div className="flex justify-center">
                  <div className="relative w-full max-w-md aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden shadow-lg">
                    <img 
                      src={generatedImage} 
                      alt="生成的美食图片" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex gap-3">
                  <button
                    onClick={downloadImage}
                    className="flex-1 bg-green-600 text-white font-medium py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    下载图片
                  </button>
                  <button
                    onClick={generateImage}
                    disabled={isGenerating}
                    className="flex-1 bg-gray-600 text-white font-medium py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    重新生成
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 提示信息 */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">生成提示</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 描述请控制在30字以内，越具体越好</li>
              <li>• 生成的图片为9:16长图，适合手机展示</li>
              <li>• 图片生成需要一定时间，请耐心等待</li>
              <li>• 如不满意可点击"重新生成"按钮</li>
            </ul>
          </div>
        </main>
      </div>
    </>
  );
}
