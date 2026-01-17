import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Utensils, Database } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const navigate = useNavigate();

  const handleTestConnection = async () => {
    setConnectionStatus('checking');
    try {
      // 尝试查询 dishes 表的一条数据，仅仅是为了测试连接
      // 如果表是空的也没关系，只要不报错就说明连接成功
      const { error } = await supabase.from('dishes').select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error('Connection test failed:', error);
        throw error;
      }
      
      setConnectionStatus('success');
      setTimeout(() => setConnectionStatus('idle'), 3000);
    } catch (err: any) {
      console.error(err);
      setConnectionStatus('error');
      alert(`连接失败: ${err.message || '未知错误'}\n请检查 .env 配置是否正确`);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('开始认证流程:', { email, isRegister });
      
      if (isRegister) {
        console.log('开始注册流程');
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: email.split('@')[0] }
          }
        });
        if (error) throw error;
        alert('注册成功！请登录。');
        setIsRegister(false);
      } else {
        console.log('开始登录流程');
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          console.error('登录错误:', error);
          throw error;
        }

        console.log('登录成功，获取用户信息:', authData);
        const userId = authData?.user?.id;

        if (!userId) {
          console.error('无法获取用户ID');
          navigate('/app');
          return;
        }

        console.log('获取用户ID成功:', userId);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error('获取用户资料错误:', profileError);
          navigate('/app');
          return;
        }

        console.log('获取用户资料成功:', profile);
        if (profile?.is_admin) {
          console.log('用户是管理员，跳转到管理员页面');
          navigate('/admin');
        } else {
          console.log('用户是普通用户，跳转到普通用户页面');
          navigate('/app');
        }
      }
    } catch (error: any) {
      console.error('认证错误:', error);
      // 显示具体的错误信息，而不是自动进入演示模式
      alert(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>登录 - 吃什么？智能餐食推荐系统</title>
        <meta name="description" content="登录吃什么？智能餐食推荐系统，解决您的每一餐选择困难，获取个性化的美食推荐。" />
        <meta name="keywords" content="智能餐食推荐, 美食推荐, 餐饮选择, 登录" />
        <meta name="author" content="DineSmart" />
        <meta property="og:title" content="登录 - 吃什么？智能餐食推荐系统" />
        <meta property="og:description" content="登录吃什么？智能餐食推荐系统，解决您的每一餐选择困难，获取个性化的美食推荐。" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dinesmart.example.com/" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-full mb-4">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">吃什么？</h1>
          <p className="text-gray-500 mt-2">解决您的每一餐选择困难</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="user@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '处理中...' : (isRegister ? '注册账号' : '立即登录')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
          </button>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center gap-4 text-xs">
             <button 
                onClick={() => navigate('/admin')}
                className="text-gray-400 hover:text-gray-600"
             >
                管理员入口
             </button>
             <span className="text-gray-300">|</span>
             <button 
                onClick={handleTestConnection}
                disabled={connectionStatus === 'checking'}
                className={`flex items-center gap-1 ${
                  connectionStatus === 'success' ? 'text-green-600' : 
                  connectionStatus === 'error' ? 'text-red-500' : 
                  'text-gray-400 hover:text-blue-600'
                }`}
             >
                <Database className="w-3 h-3" />
                {connectionStatus === 'checking' ? '连接中...' : 
                 connectionStatus === 'success' ? '连接成功' : 
                 connectionStatus === 'error' ? '连接失败' : '测试数据库连接'}
             </button>
        </div>
      </div>
    </div>
    </>
  );
}
