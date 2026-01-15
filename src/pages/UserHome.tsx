import React, { useState } from 'react';
import { MOCK_DISHES, supabase } from '@/lib/supabase';
import { DishCard } from '@/components/DishCard';
import { Dish } from '@/types';
import { Check, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UserHome() {
  const navigate = useNavigate();
  // State for recommendation flow
  const [currentDish, setCurrentDish] = useState<Dish | null>(null);
  const [acceptedDish, setAcceptedDish] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(false);
  const [goal, setGoal] = useState<{
    daily_calories?: number;
    protein_target?: number;
    carbs_target?: number;
    fat_target?: number;
  }>({});
  const [dishes, setDishes] = useState<Dish[]>([]);

  // Initial load
  React.useEffect(() => {
    loadGoals();
    loadDishes();
  }, []);

  const loadGoals = async () => {
    try {
      const { data } = await supabase
        .from('nutritional_goals')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (data) {
        setGoal({
          daily_calories: (data as any).daily_calories,
          protein_target: (data as any).protein_target,
          carbs_target: (data as any).carbs_target,
          fat_target: (data as any).fat_target,
        });
      }
    } catch {}
  };

  const loadDishes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const dishesData = data as Dish[];
        console.log('从Supabase获取的菜品数据:', dishesData);
        setDishes(dishesData);
        const random = dishesData[Math.floor(Math.random() * dishesData.length)];
        setCurrentDish(random);
      } else {
        console.log('使用模拟数据');
        const random = MOCK_DISHES[Math.floor(Math.random() * MOCK_DISHES.length)];
        setCurrentDish(random);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!currentDish) return;
    setAcceptedDish(currentDish);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        return;
      }

      const user = userData.user;

      await supabase.from('meal_records').insert({
        user_id: user.id,
        user_name: user.email,
        dish_id: currentDish.id,
        dish_name: currentDish.name,
        nutrition_value: currentDish.description,
        calories: currentDish.calories,
        reason: currentDish.description,
        is_selected: true,
        selected_at: new Date().toISOString(),
      });
    } catch (e) {
    }
  };

  const handleReject = () => {
    if (dishes.length > 0) {
      const random = dishes[Math.floor(Math.random() * dishes.length)];
      setCurrentDish(random);
      return;
    }
    const random = MOCK_DISHES[Math.floor(Math.random() * MOCK_DISHES.length)];
    setCurrentDish(random);
  };

  const handleLogout = () => {
      localStorage.removeItem('demo_user');
      navigate('/');
  };

  if (loading && !currentDish) {
      return <div className="min-h-screen flex items-center justify-center text-gray-500">正在为您挑选美食...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="font-bold text-lg text-gray-800">今天吃什么？</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/history')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              历史餐食
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full flex flex-col justify-center">
        <div className="mb-4 bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-gray-800">营养摄入标准（每日）</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-gray-500">热量</div>
              <div className="font-medium text-gray-800">
                {goal.daily_calories ?? '—'} kcal
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-gray-500">蛋白质</div>
              <div className="font-medium text-gray-800">
                {goal.protein_target ?? '—'} g
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-gray-500">碳水</div>
              <div className="font-medium text-gray-800">
                {goal.carbs_target ?? '—'} g
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-gray-500">脂肪</div>
              <div className="font-medium text-gray-800">
                {goal.fat_target ?? '—'} g
              </div>
            </div>
          </div>
        </div>
        
        {acceptedDish ? (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">祝您用餐愉快！</h2>
                <p className="text-gray-500">您已选择该餐食，系统已记录。</p>
            </div>

            <DishCard dish={acceptedDish} showDetails={true} />
            
            <button 
                onClick={() => setAcceptedDish(null)}
                className="flex items-center justify-center gap-2 text-gray-500 mx-auto mt-8 hover:text-gray-800"
            >
                <ArrowLeft className="w-4 h-4" />
                重新选择
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">为您推荐</h2>
                <p className="text-sm text-gray-500">根据您的营养均衡程度匹配</p>
            </div>

            {loading ? (
                 <div className="h-96 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400">
                    计算推荐算法中...
                 </div>
            ) : (
                currentDish && <DishCard dish={currentDish} />
            )}

            <div className="flex gap-4 justify-center mt-8">
                <button 
                    onClick={handleReject}
                    disabled={loading}
                    className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                    <X className="w-5 h-5" />
                    不喜欢，换一个
                </button>
                <button 
                    onClick={handleAccept}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                    <Check className="w-5 h-5" />
                    就吃这个
                </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
