import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MealRecord } from '@/types';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import posthog from 'posthog-js';

// 添加GA类型声明，避免TypeScript错误
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default function UserHistory() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<MealRecord | null>(null);
  const [evaluation, setEvaluation] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          navigate('/');
          return;
        }

        const { data, error } = await supabase
          .from('meal_records')
          .select('*')
          .eq('user_id', userData.user.id)
          .order('selected_at', { ascending: false });

        if (!error && data) {
          setRecords(data as MealRecord[]);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const openDetail = (record: MealRecord) => {
    setSelected(record);
    setEvaluation(record.evaluation || '');
  };

  const handleSaveEvaluation = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('meal_records')
        .update({ evaluation })
        .eq('id', selected.id);

      if (!error) {
        setRecords(prev =>
          prev.map(r => (r.id === selected.id ? { ...r, evaluation } : r))
        );
        setSelected(prev => (prev ? { ...prev, evaluation } : prev));
        
        // 上报GA自定义事件
        if (window.gtag) {
          window.gtag('event', 'meal_evaluation', {
            'event_category': 'user_interaction',
            'event_label': selected.dish_name,
            'value': evaluation.length > 0 ? 1 : 0,
            'dish_id': selected.dish_id,
            'evaluation_length': evaluation.length
          });
        }
        
        // 上报PostHog事件
        posthog.capture('meal_evaluation', {
          'dish_name': selected.dish_name,
          'dish_id': selected.dish_id,
          'evaluation_length': evaluation.length,
          'is_evaluation_submitted': evaluation.length > 0
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>历史餐食记录 - 吃什么？</title>
        <meta name="description" content="查看您的历史餐食记录，管理和评价您的餐食选择，跟踪您的饮食习惯。" />
        <meta name="keywords" content="历史餐食记录, 餐食管理, 饮食习惯, 营养跟踪" />
        <meta name="author" content="DineSmart" />
        <meta property="og:title" content="历史餐食记录 - 吃什么？" />
        <meta property="og:description" content="查看您的历史餐食记录，管理和评价您的餐食选择，跟踪您的饮食习惯。" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dinesmart.example.com/history" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/app')}
              className="text-gray-500 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-lg text-gray-800">历史餐食记录</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="text-center text-gray-500 mt-20">加载中...</div>
        ) : records.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">暂无历史记录</div>
        ) : (
          <div className="space-y-3">
            {records.map(record => (
              <button
                key={record.id}
                onClick={() => openDetail(record)}
                className="w-full text-left bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {record.dish_name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {record.nutrition_value}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>{Math.round(record.calories)} kcal</div>
                    <div className="mt-1">
                      {record.is_selected ? '已选择' : '未选择'}
                    </div>
                    <div className="mt-1 text-xs">
                      {new Date(record.selected_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-500">餐食名称</div>
                <div className="font-semibold text-gray-900">
                  {selected.dish_name}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">热量</div>
                <div className="font-semibold text-gray-900">
                  {Math.round(selected.calories)} kcal
                </div>
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
              <div className="text-sm text-gray-500 mb-1">选择时间</div>
              <div className="text-sm text-gray-800">
                {new Date(selected.selected_at).toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1">我的评价</div>
              <textarea
                value={evaluation}
                onChange={e => setEvaluation(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                rows={3}
                placeholder="写下这一餐的感受或评价..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 text-sm rounded-lg border text-gray-600 hover:bg-gray-50"
              >
                关闭
              </button>
              <button
                onClick={handleSaveEvaluation}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存评价'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
    </>
  );
}

