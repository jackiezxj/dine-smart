import { createClient } from '@supabase/supabase-js'

// 这些环境变量需要在 .env 文件中配置
// 为了演示，如果没有配置，我们会给一个提示
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Mock Data for demonstration when no backend is connected
export const MOCK_DISHES = [
  {
    id: '1',
    name: '宫保鸡丁',
    description: '经典的川菜，鸡肉鲜嫩，花生香脆，口味酸甜微辣。',
    calories: 480,
    protein: 32,
    carbs: 12,
    fat: 28,
    image_url: 'https://images.unsplash.com/photo-1525351484163-7529414395d8?auto=format&fit=crop&q=80&w=1000',
    tags: ['川菜', '高蛋白']
  },
  {
    id: '2',
    name: '清炒时蔬',
    description: '选用当季新鲜蔬菜，保留食材原味，清淡健康。',
    calories: 120,
    protein: 4,
    carbs: 18,
    fat: 5,
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=1000',
    tags: ['素食', '低卡']
  },
  {
    id: '3',
    name: '红烧牛肉面',
    description: '汤浓肉烂，面条劲道，是一碗抚慰人心的好面。',
    calories: 650,
    protein: 45,
    carbs: 80,
    fat: 22,
    image_url: 'https://images.unsplash.com/photo-1554502078-ef0fc409efce?auto=format&fit=crop&q=80&w=1000',
    tags: ['面食', '晚餐推荐']
  }
];

// 辅助函数：确保图片URL有效
export const getValidImageUrl = (url: string | undefined | null): string => {
  console.log('getValidImageUrl 输入:', url);
  
  if (!url) {
    console.log('URL为空，返回占位图');
    // 使用更可靠的占位图片源
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400&h=300&fit=crop';
  }
  
  // 确保URL使用HTTPS
  if (url.startsWith('http://')) {
    const httpsUrl = url.replace('http://', 'https://');
    console.log('将HTTP URL转换为HTTPS:', httpsUrl);
    return httpsUrl;
  }
  
  // 检查URL格式是否正确
  if (url.startsWith('https://')) {
    console.log('URL格式正确，直接返回:', url);
    return url;
  }
  
  // 如果是相对路径或无效URL，返回占位图
  console.log('URL格式无效，返回占位图');
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400&h=300&fit=crop';
};
