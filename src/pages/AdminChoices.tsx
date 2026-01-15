import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MealRecord } from '@/types';

export default function AdminChoices() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<MealRecord | null>(null);

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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('meal_records')
          .select('*')
          .order('selected_at', { ascending: false });

        if (!error && data) {
          setRecords(data as MealRecord[]);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="text-gray-500 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-lg text-gray-800">用户选择餐食记录</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-5xl mx-auto w-full">
        {loading ? (
          <div className="text-center text-gray-500 mt-20">加载中...</div>
        ) : records.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">暂无用户选择记录</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="max-h-[480px] overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-500 font-medium">
                      用户名称
                    </th>
                    <th className="px-4 py-2 text-left text-gray-500 font-medium">
                      餐食名称
                    </th>
                    <th className="px-4 py-2 text-left text-gray-500 font-medium">
                      选择时间
                    </th>
                    <th className="px-4 py-2 text-left text-gray-500 font-medium">
                      是否选择
                    </th>
                    <th className="px-4 py-2 text-left text-gray-500 font-medium">
                      用户评价
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(record => (
                    <tr
                      key={record.id}
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelected(record)}
                    >
                      <td className="px-4 py-2 text-gray-800">
                        {record.user_name || record.user_id}
                      </td>
                      <td className="px-4 py-2 text-gray-800">
                        {record.dish_name}
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {new Date(record.selected_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {record.is_selected ? '已选择' : '未选择'}
                      </td>
                      <td className="px-4 py-2 text-gray-600 max-w-xs truncate">
                        {record.evaluation || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selected && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-500">用户名称</div>
                <div className="font-semibold text-gray-900">
                  {selected.user_name || selected.user_id}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">选择时间</div>
                <div className="text-sm text-gray-800">
                  {new Date(selected.selected_at).toLocaleString()}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1">餐食名称</div>
              <div className="text-sm text-gray-900 font-semibold">
                {selected.dish_name}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1">营养价值</div>
              <div className="text-sm text-gray-800">
                {selected.nutrition_value}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1">推荐理由</div>
              <div className="text-sm text-gray-800">{selected.reason}</div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1">用户评价</div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap">
                {selected.evaluation || '暂无评价'}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 text-sm rounded-lg border text-gray-600 hover:bg-gray-50"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

