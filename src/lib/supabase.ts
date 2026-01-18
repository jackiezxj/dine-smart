import { createClient } from '@supabase/supabase-js'

// 这些环境变量需要在 .env 文件中配置
// 为了演示，如果没有配置，我们会给一个提示
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// 检查环境变量是否正确设置
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? '***' : '未设置');

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 检查Supabase客户端是否正确初始化
console.log('Supabase客户端初始化:', {
  url: supabase.supabaseUrl,
  key: supabase.supabaseKey ? '***' : '未设置',
  authUrl: supabase.authUrl,
  realtimeUrl: supabase.realtimeUrl,
  storageUrl: supabase.storageUrl,
  functionsUrl: supabase.functionsUrl,
});

// 为supabase.auth.signInWithPassword添加日志
const originalSignInWithPassword = supabase.auth.signInWithPassword;
supabase.auth.signInWithPassword = async function(credentials: { email: string; password: string }) {
  console.log('开始登录流程:', {
    email: credentials.email,
    password: '***',
    timestamp: new Date().toISOString(),
  });
  
  try {
    // 尝试使用真实的Supabase认证服务
    console.log('尝试调用Supabase auth.signInWithPassword');
    const result = await originalSignInWithPassword.apply(this, [credentials]);
    
    if (result.error) {
      console.error('Supabase认证失败:', {
        error: result.error,
        code: result.error.code,
        message: result.error.message,
        details: result.error.details,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.log('Supabase认证成功:', {
        user: {
          id: result.data.user?.id,
          email: result.data.user?.email,
          email_verified: result.data.user?.email_verified,
        },
        session: result.data.session ? '***' : null,
        timestamp: new Date().toISOString(),
      });
    }
    
    return result;
  } catch (error: any) {
    console.error('登录过程中发生错误:', {
      error: error,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

// 为supabase.from添加日志和错误处理
const originalFrom = supabase.from;
supabase.from = (table: string) => {
  try {
    console.log('调用supabase.from:', table);
    
    // 检查originalFrom是否存在
    if (!originalFrom) {
      console.error('originalFrom不存在，无法调用supabase.from');
      throw new Error('Supabase客户端未正确初始化');
    }
    
    const realTable = originalFrom(table);
    
    // 检查realTable是否存在
    if (!realTable) {
      console.error('无法获取真实的表对象:', table);
      throw new Error(`无法获取表 ${table}`);
    }
    
    // 为profiles表的select方法添加日志
    if (table === 'profiles' && realTable.select) {
      const originalSelect = realTable.select;
      realTable.select = function(...args: any[]) {
        console.log('调用profiles.select:', args);
        
        try {
          const realSelectResult = originalSelect.apply(this, args);
          
          // 为eq方法添加日志
          if (realSelectResult && realSelectResult.eq) {
            const originalEq = realSelectResult.eq;
            realSelectResult.eq = function(column: string, value: any) {
              console.log('调用profiles.select.eq:', column, value);
              
              try {
                const realEqResult = originalEq.apply(this, [column, value]);
                
                // 为single方法添加日志
                if (realEqResult && realEqResult.single) {
                  const originalSingle = realEqResult.single;
                  realEqResult.single = async function() {
                    console.log('调用profiles.select.eq.single');
                    try {
                      const result = await originalSingle.apply(this);
                      if (result.error) {
                        console.error('获取用户资料失败:', result.error);
                      } else {
                        console.log('获取用户资料成功:', {
                          id: result.data?.id,
                          username: result.data?.username,
                          is_admin: result.data?.is_admin,
                        });
                      }
                      return result;
                    } catch (error: any) {
                      console.error('获取用户资料过程中发生错误:', error);
                      throw error;
                    }
                  };
                }
                
                return realEqResult;
              } catch (error: any) {
                console.error('调用profiles.select.eq时发生错误:', error);
                throw error;
              }
            };
          }
          
          return realSelectResult;
        } catch (error: any) {
          console.error('调用profiles.select时发生错误:', error);
          throw error;
        }
      };
    }
    
    return realTable;
  } catch (error: any) {
    console.error('调用supabase.from时发生错误:', error);
    throw error;
  }
};

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
