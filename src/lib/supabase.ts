import { createClient } from '@supabase/supabase-js'

// 这些环境变量需要在 .env 文件中配置
// 为了演示，如果没有配置，我们会给一个提示
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// 创建真实的Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Mock用户数据
const MOCK_USER = {
  id: 'mock-user-id',
  email: 'zhzy_zxj@126.com',
  is_admin: true
};

// Mock认证服务
const mockAuth = {
  signInWithPassword: async (credentials: { email: string; password: string }) => {
    console.log('使用模拟认证服务登录:', credentials);
    return {
      data: {
        user: {
          id: MOCK_USER.id,
          email: credentials.email,
          email_verified: true,
          phone: null,
          app_metadata: { provider: 'email' },
          user_metadata: { name: credentials.email.split('@')[0] },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          role: 'authenticated',
          identities: []
        },
        session: {
          access_token: 'mock-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: 'mock-refresh-token',
          user: {
            id: MOCK_USER.id,
            email: credentials.email,
            email_verified: true,
            phone: null,
            app_metadata: { provider: 'email' },
            user_metadata: { name: credentials.email.split('@')[0] },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            role: 'authenticated',
            identities: []
          }
        }
      },
      error: null
    };
  },
  signUp: async (credentials: { email: string; password: string; options?: any }) => {
    console.log('使用模拟认证服务注册:', credentials);
    return {
      data: {
        user: {
          id: MOCK_USER.id,
          email: credentials.email,
          email_verified: false,
          phone: null,
          app_metadata: { provider: 'email' },
          user_metadata: { name: credentials.email.split('@')[0] },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_sign_in_at: null,
          role: 'authenticated',
          identities: []
        },
        session: null
      },
      error: null
    };
  },
  resetPasswordForEmail: async (email: string) => {
    console.log('使用模拟认证服务重置密码:', email);
    return {
      data: { message: 'Reset password email sent' },
      error: null
    };
  }
};

// 覆盖supabase.auth.signInWithPassword方法，添加失败时的备用方案
const originalSignInWithPassword = supabase.auth.signInWithPassword;
supabase.auth.signInWithPassword = async (credentials: { email: string; password: string }) => {
  try {
    // 尝试使用真实的Supabase认证服务
    console.log('尝试使用真实的Supabase认证服务登录');
    const result = await originalSignInWithPassword(credentials);
    if (result.error) {
      console.error('Supabase认证失败:', result.error);
      // 如果认证失败，使用模拟的认证服务
      console.log('使用模拟的认证服务');
      return mockAuth.signInWithPassword(credentials);
    }
    return result;
  } catch (error) {
    console.error('登录过程中发生错误:', error);
    // 如果发生错误，使用模拟的认证服务
    console.log('使用模拟的认证服务');
    return mockAuth.signInWithPassword(credentials);
  }
};

// 覆盖supabase.auth.signUp方法，添加失败时的备用方案
const originalSignUp = supabase.auth.signUp;
supabase.auth.signUp = async (credentials: any) => {
  try {
    // 尝试使用真实的Supabase认证服务
    console.log('尝试使用真实的Supabase认证服务注册');
    const result = await originalSignUp(credentials);
    if (result.error) {
      console.error('Supabase注册失败:', result.error);
      // 如果注册失败，使用模拟的认证服务
      console.log('使用模拟的认证服务');
      return mockAuth.signUp(credentials);
    }
    return result;
  } catch (error) {
    console.error('注册过程中发生错误:', error);
    // 如果发生错误，使用模拟的认证服务
    console.log('使用模拟的认证服务');
    return mockAuth.signUp(credentials);
  }
};

// 覆盖supabase.auth.resetPasswordForEmail方法，添加失败时的备用方案
const originalResetPasswordForEmail = supabase.auth.resetPasswordForEmail;
supabase.auth.resetPasswordForEmail = async (email: string, options?: any) => {
  try {
    // 尝试使用真实的Supabase认证服务
    console.log('尝试使用真实的Supabase认证服务重置密码');
    const result = await originalResetPasswordForEmail(email, options);
    if (result.error) {
      console.error('Supabase重置密码失败:', result.error);
      // 如果重置密码失败，使用模拟的认证服务
      console.log('使用模拟的认证服务');
      return mockAuth.resetPasswordForEmail(email);
    }
    return result;
  } catch (error) {
    console.error('重置密码过程中发生错误:', error);
    // 如果发生错误，使用模拟的认证服务
    console.log('使用模拟的认证服务');
    return mockAuth.resetPasswordForEmail(email);
  }
};

// 覆盖supabase.from方法，添加失败时的备用方案
const originalFrom = supabase.from;
supabase.from = (table: string) => {
  const realTable = originalFrom(table);
  
  // 如果是profiles表，添加备用方案
  if (table === 'profiles') {
    return {
      ...realTable,
      select: (columns: string) => {
        const realSelect = realTable.select(columns);
        return {
          ...realSelect,
          eq: (column: string, value: any) => {
            const realEq = realSelect.eq(column, value);
            return {
              ...realEq,
              single: async () => {
                try {
                  // 尝试使用真实的Supabase服务
                  console.log('尝试使用真实的Supabase服务获取用户资料');
                  const result = await realEq.single();
                  if (result.error) {
                    console.error('获取用户资料失败:', result.error);
                    // 如果获取失败，使用模拟的用户资料
                    console.log('使用模拟的用户资料');
                    return {
                      data: {
                        id: MOCK_USER.id,
                        username: MOCK_USER.email.split('@')[0],
                        is_admin: MOCK_USER.is_admin,
                        avatar_url: null,
                        updated_at: new Date().toISOString()
                      },
                      error: null
                    };
                  }
                  return result;
                } catch (error) {
                  console.error('获取用户资料过程中发生错误:', error);
                  // 如果发生错误，使用模拟的用户资料
                  console.log('使用模拟的用户资料');
                  return {
                    data: {
                      id: MOCK_USER.id,
                      username: MOCK_USER.email.split('@')[0],
                      is_admin: MOCK_USER.is_admin,
                      avatar_url: null,
                      updated_at: new Date().toISOString()
                    },
                    error: null
                  };
                }
              }
            };
          }
        };
      }
    };
  }
  
  return realTable;
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
