import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Dish } from '@/types';
import { Helmet } from 'react-helmet-async';

export default function AdminHome() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    description: '',
  });
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [goalSaving, setGoalSaving] = useState(false);
  const [goal, setGoal] = useState({
    daily_calories: '',
    protein_target: '',
    carbs_target: '',
    fat_target: '',
    min_veggies: '',
  });

  const loadDishes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取菜品失败:', error);
      } else if (data) {
        const dishesData = data as Dish[];
        console.log('获取到的菜品数据:', dishesData);
        setDishes(dishesData);
        
        // 如果当前正在编辑的菜品在列表中，确保图片预览正确
        if (formData.id) {
          const currentEditingDish = dishesData.find(d => d.id === formData.id);
          if (currentEditingDish) {
            setImagePreview(currentEditingDish.image_url || null);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDishes();
    loadGoals();
  }, []);

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      description: '',
    });
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setSaving(true);
    try {
      // 首先检查用户是否已认证，确保isAuthenticated在使用前已经被定义
      const { data: authData } = await supabase.auth.getUser();
      const isAuthenticated = !!authData?.user;
      
      let image_url: string | undefined;
      if (imageFile) {
        // 生成安全的文件名：只包含英文、数字和下划线，去除中文字符
        const fileExtension = imageFile.name.split('.').pop() || '';
        const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExtension}`;
        const path = safeFileName;
        console.log('开始上传图片，路径:', path);
        
        // 演示模式下，等待图片预览URL生成完成
        if (!isAuthenticated) {
          // 等待图片预览URL生成完成
          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const previewUrl = reader.result as string;
              image_url = previewUrl;
              // 更新图片预览
              setImagePreview(previewUrl);
              resolve();
            };
            reader.readAsDataURL(imageFile);
          });
        } else {
          // 已认证用户，执行实际的图片上传
          try {
            // 先检查存储桶是否存在
            const { data: buckets } = await supabase.storage.listBuckets();
            console.log('可用的存储桶:', buckets?.map(b => b.name));
            
            const { error: uploadError } = await supabase.storage
              .from('dish-images')
              .upload(path, imageFile, { upsert: true });
            
            if (uploadError) {
              console.error('图片上传失败:', uploadError);
              
              // 处理各种存储错误
              if (uploadError.message.includes('Bucket not found')) {
                alert('错误：存储桶 "dish-images" 不存在。请在 Supabase 控制台创建该存储桶。');
              } else if (uploadError.message.includes('Invalid key')) {
                alert('错误：文件名包含无效字符。系统已自动生成安全文件名，重新尝试上传。');
              } else if (uploadError.message.includes('violates row-level security policy')) {
                alert('错误：您没有权限上传图片。请确保您是管理员，或检查 Storage 的 RLS 策略。');
              } else {
                alert(`图片上传失败：${uploadError.message}`);
              }
              
              // 图片上传失败，不继续执行
              return;
            } else {
              const { data: urlData } = supabase.storage
                .from('dish-images')
                .getPublicUrl(path);
              image_url = urlData.publicUrl;
              console.log('图片上传成功，URL:', image_url);
              // 更新图片预览
              setImagePreview(image_url);
            }
          } catch (error) {
            console.error('图片上传过程出错:', error);
            alert('图片上传过程中发生错误，请检查控制台日志。');
            // 图片上传出错，不继续执行
            return;
          }
        }
      } else {
        console.log('没有新上传的图片，使用现有图片URL');
      }
      // 构建payload，确保编辑时不会丢失现有图片URL
      const payload = {
        name: formData.name,
        description: formData.description,
        calories: Number(formData.calories) || 0,
        protein: Number(formData.protein) || 0,
        carbs: Number(formData.carbs) || 0,
        fat: Number(formData.fat) || 0,
        image_url: image_url, // 初始定义时包含image_url属性
      };
      
      if (isAuthenticated) {
        // 已认证用户，正常执行数据库操作
        if (formData.id) {
          const { error } = await supabase
            .from('dishes')
            .update(payload)
            .eq('id', formData.id);

          if (error) {
            console.error('更新菜品失败:', error);
            if (error.message.includes('violates row-level security policy')) {
              alert('错误：您没有权限修改菜品。请确保您是管理员。');
            } else {
              alert(`更新菜品失败：${error.message}`);
            }
          } else {
            await loadDishes();
            resetForm();
          }
        } else {
          const { error } = await supabase.from('dishes').insert(payload);
          if (error) {
            console.error('插入菜品失败:', error);
            if (error.message.includes('violates row-level security policy')) {
              alert('错误：您没有权限添加菜品。请确保您是管理员。');
            } else {
              alert(`添加菜品失败：${error.message}`);
            }
          } else {
            await loadDishes();
            resetForm();
          }
        }
      } else {
        // 演示模式，添加模拟菜品到本地状态，不执行数据库操作
        console.log('演示模式：添加模拟菜品');
        
        // 创建模拟菜品数据
        const mockDish: any = {
          id: `mock_${Date.now()}`,
          ...payload,
          created_at: new Date().toISOString(),
          image_url: image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400&h=300&fit=crop'
        };
        
        // 添加到本地菜品列表
        setDishes(prev => [mockDish, ...prev]);
        
        alert('演示模式：菜品添加成功！在真实环境中，数据将被保存到 Supabase 数据库。');
        
        // 重置表单，但保留图片预览逻辑
        setFormData({
          id: '',
          name: '',
          calories: '',
          protein: '',
          carbs: '',
          fat: '',
          description: '',
        });
        setImageFile(null);
        // 不清空图片预览，让用户能看到
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (dish: Dish) => {
    console.log('编辑菜品:', dish);
    setFormData({
      id: dish.id,
      name: dish.name,
      calories: String(dish.calories),
      protein: String(dish.protein),
      carbs: String(dish.carbs),
      fat: String(dish.fat),
      description: dish.description,
    });
    // 直接设置图片预览，确保编辑时能看到图片
    console.log('设置图片预览:', dish.image_url);
    setImagePreview(dish.image_url || null);
    setImageFile(null);
  };

  // 图片预览状态
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 监听图片文件变化，生成预览
  React.useEffect(() => {
    console.log('图片预览逻辑触发:', {
      imageFile: !!imageFile,
      formDataId: formData.id,
      dishesLength: dishes.length
    });
    
    if (imageFile) {
      console.log('有新上传的图片，生成预览');
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    } else if (formData.id) {
      // 编辑模式下，显示现有菜品图片
      const dish = dishes.find(d => d.id === formData.id);
      console.log('编辑模式，查找菜品:', dish?.id, dish?.name);
      console.log('编辑模式，菜品图片URL:', dish?.image_url);
      
      // 直接设置图片预览，无论图片URL是否有效
      if (dish?.image_url) {
        setImagePreview(dish.image_url);
      } else {
        // 如果没有图片URL，使用占位图
        setImagePreview('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400&h=300&fit=crop');
      }
    } else {
      // 新建模式，不清空图片预览，保持现有预览
      console.log('新建模式，保持现有图片预览');
      // 不设置 setImagePreview(null)，保持现有预览
    }
  }, [imageFile, formData.id, dishes]);

  const handleDelete = async (dish: Dish) => {
    if (!window.confirm(`确定要删除菜品「${dish.name}」吗？`)) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('dishes').delete().eq('id', dish.id);
      if (!error) {
        await loadDishes();
        if (formData.id === dish.id) {
          resetForm();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredDishes = dishes.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const loadGoals = async () => {
    try {
      const { data } = await supabase
        .from('nutritional_goals')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (data) {
        setGoal({
          daily_calories: String((data as any).daily_calories ?? ''),
          protein_target: String((data as any).protein_target ?? ''),
          carbs_target: String((data as any).carbs_target ?? ''),
          fat_target: String((data as any).fat_target ?? ''),
          min_veggies: String((data as any).min_veggies ?? ''),
        });
      }
    } catch {}
  };

  const saveGoals = async () => {
    setGoalSaving(true);
    try {
      const payload = {
        id: 'default',
        daily_calories: Number(goal.daily_calories) || null,
        protein_target: Number(goal.protein_target) || null,
        carbs_target: Number(goal.carbs_target) || null,
        fat_target: Number(goal.fat_target) || null,
        min_veggies: Number(goal.min_veggies) || null,
      };
      await supabase.from('nutritional_goals').upsert(payload, { onConflict: 'id' });
    } finally {
      setGoalSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      // 清除本地存储
      localStorage.removeItem('demo_user');
      // 调用 Supabase 登出
      await supabase.auth.signOut();
    } catch (error) {
      console.error('登出失败:', error);
    } finally {
      // 导航回登录页
      navigate('/');
    }
  };
  return (
    <>
      <Helmet>
        <title>管理员后台 - 菜品录入</title>
        <meta name="description" content="管理员后台，用于录入和管理菜品信息，设置营养摄入标准。" />
        <meta name="keywords" content="管理员后台, 菜品录入, 菜品管理, 营养标准设置" />
        <meta name="author" content="DineSmart" />
        <meta property="og:title" content="管理员后台 - 菜品录入" />
        <meta property="og:description" content="管理员后台，用于录入和管理菜品信息，设置营养摄入标准。" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dinesmart.example.com/admin" />
      </Helmet>
      <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-800">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">管理员后台 - 菜品录入</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/choices')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                用户选择记录
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                退出
              </button>
            </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="font-semibold text-gray-700 mb-4">营养摄入标准设置（每日）</h3>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-gray-500 mb-1">热量 (kcal)</div>
                          <input
                            value={goal.daily_calories}
                            onChange={e => setGoal({...goal, daily_calories: e.target.value})}
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="例如：2000"
                          />
                        </div>
                        <div>
                          <div className="text-gray-500 mb-1">蔬菜水果种类</div>
                          <input
                            value={goal.min_veggies}
                            onChange={e => setGoal({...goal, min_veggies: e.target.value})}
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="例如：12"
                          />
                        </div>
                        <div>
                          <div className="text-gray-500 mb-1">蛋白质 (g)</div>
                          <input
                            value={goal.protein_target}
                            onChange={e => setGoal({...goal, protein_target: e.target.value})}
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="例如：75"
                          />
                        </div>
                        <div>
                          <div className="text-gray-500 mb-1">碳水 (g)</div>
                          <input
                            value={goal.carbs_target}
                            onChange={e => setGoal({...goal, carbs_target: e.target.value})}
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="例如：260"
                          />
                        </div>
                        <div>
                          <div className="text-gray-500 mb-1">脂肪 (g)</div>
                          <input
                            value={goal.fat_target}
                            onChange={e => setGoal({...goal, fat_target: e.target.value})}
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="例如：70"
                          />
                        </div>
                      </div>
                      <button
                        onClick={saveGoals}
                        disabled={goalSaving}
                        className="w-full mt-2 text-white bg-blue-600 rounded py-2 hover:bg-blue-700 disabled:opacity-50"
                      >
                        {goalSaving ? '保存中...' : '保存标准'}
                      </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-gray-700 mb-4">菜品列表</h3>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="搜索菜品名称"
                    className="w-full mb-3 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                  <div className="space-y-2 max-h-80 overflow-y-auto text-sm">
                    {loading ? (
                      <div className="text-gray-400 text-center py-4">加载中...</div>
                    ) : filteredDishes.length === 0 ? (
                      <div className="text-gray-400 text-center py-4">暂无菜品</div>
                    ) : (
                      filteredDishes.map(dish => (
                        <div
                          key={dish.id}
                          className="border rounded-md px-3 py-2 flex items-center justify-between hover:bg-gray-50"
                        >
                          <div>
                            <div className="font-medium text-gray-800">{dish.name}</div>
                            <div className="text-xs text-gray-500">
                              {Math.round(dish.calories)} kcal
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <button
                              onClick={() => handleEdit(dish)}
                              className="px-2 py-1 rounded border border-blue-500 text-blue-600 hover:bg-blue-50"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDelete(dish)}
                              className="px-2 py-1 rounded border border-red-500 text-red-600 hover:bg-red-50"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
            </div>

            <div className="md:col-span-2">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-blue-600" />
                        {formData.id ? '编辑菜品' : '录入新菜品'}
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">菜品名称</label>
                            <input 
                                required
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
                                placeholder="例如：西红柿炒蛋"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">热量 (kcal)</label>
                                <input 
                                    type="number"
                                    required
                                    value={formData.calories}
                                    onChange={e => setFormData({...formData, calories: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">蛋白质 (g)</label>
                                <input 
                                    type="number"
                                    required
                                    value={formData.protein}
                                    onChange={e => setFormData({...formData, protein: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">碳水 (g)</label>
                                <input 
                                    type="number"
                                    required
                                    value={formData.carbs}
                                    onChange={e => setFormData({...formData, carbs: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">脂肪 (g)</label>
                                <input 
                                    type="number"
                                    required
                                    value={formData.fat}
                                    onChange={e => setFormData({...formData, fat: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">推荐理由 / 描述</label>
                            <textarea 
                                required
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none" 
                                placeholder="描述这道菜的营养价值..."
                            />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">菜品图片（可选）</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => setImageFile(e.target.files?.[0] || null)}
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            将上传到 Supabase Storage 的 dish-images 存储桶
                          </p>
                          
                          {/* 图片预览 */}
                          <div className="mt-3">
                            <div className="text-sm text-gray-500 mb-1">图片预览</div>
                            <div className="relative w-full h-48 border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
                              {imagePreview ? (
                                <>
                                  <img 
                                    src={imagePreview} 
                                    alt="预览" 
                                    className="max-w-full max-h-full object-contain"
                                  />
                                  <div className="absolute bottom-2 right-2 bg-white/80 px-2 py-1 text-xs rounded">
                                    已上传
                                  </div>
                                </>
                              ) : (
                                <div className="text-gray-400">
                                  {formData.id ? '无图片' : '未上传图片'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pt-4">
                            <button 
                                type="submit"
                                disabled={saving}
                                className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? '保存中...' : '保存菜品数据'}
                            </button>
                            {formData.id && (
                              <button
                                type="button"
                                onClick={resetForm}
                                className="w-full mt-2 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50"
                              >
                                取消编辑
                              </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
      </main>
    </div>
    </>
  );
}
