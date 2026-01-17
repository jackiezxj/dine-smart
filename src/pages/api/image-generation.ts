import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 从请求体获取描述
    const { description } = req.body;
    
    if (!description || description.length > 30) {
      return res.status(400).json({ error: '描述不能为空且不能超过30字' });
    }

    // 从Supabase获取API密钥
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('service_name', 'aliyun_dashscope')
      .limit(1)
      .maybeSingle();

    if (apiKeyError) {
      console.error('Failed to fetch API key:', apiKeyError);
      return res.status(500).json({ error: '获取API密钥失败' });
    }

    if (!apiKeyData) {
      return res.status(500).json({ error: '未找到API密钥' });
    }

    const apiKey = apiKeyData.api_key;

    // 调用阿里云DashScope API生成图片
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "model": "qwen-image-max",
        "input": {
          "prompt": `你是一个专业的美食视觉生成模型，擅长将简短的文字描述转化为高质量、极具食欲感的美食图片。
任务规则：
用户将输入一段不超过30字的中文描述。
首先判断输入内容是否与“食物 / 菜品 / 饮品 / 美食场景”直接相关。
若不相关（如人物、风景、情绪、抽象概念等），请不要生成图片，而是直接返回以下固定提示：
「请输入与食物相关的描述，例如菜品、口味、食材或烹饪方式。」
若输入内容与美食相关，请基于用户描述生成一幅美食图片，并遵循以下生成要求：
美食图片生成要求：
画面主体必须是清晰、具体的食物或菜品
风格偏向真实美食摄影 / 高级餐饮宣传图
强调：
食材质感（油润、酥脆、嫩滑、多汁等）
色泽诱人（温暖光线、自然高饱和但不失真）
新鲜感与“刚出锅 / 刚上桌”的状态
构图干净，背景简洁或虚化，避免杂乱
光影自然，突出美食细节，让人一看就产生食欲、垂涎欲滴
不出现人物正脸、不出现文字、水印、logo
输出要求：
仅生成一幅符合描述的美食图片
不附加解释性文字，不重复用户输入内容
可选：如果你希望“更偏商业级效果”，可在末尾追加一句
整体效果应达到「高端美食网站首页主图 / 外卖平台爆款菜品封面」的视觉水准。

用户输入：${description}`
        },
        "parameters": {
          "size": "720x1280", // 9:16 长图
          "n": 1
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('API error:', data);
      return res.status(response.status).json({ error: data.message || '生成图片失败' });
    }

    if (data.output && data.output.results && data.output.results.length > 0) {
      return res.status(200).json({ imageUrl: data.output.results[0].url });
    } else {
      return res.status(500).json({ error: '生成图片失败，请重试' });
    }
  } catch (error) {
    console.error('Error generating image:', error);
    return res.status(500).json({ error: '生成图片失败，请检查网络连接并重试' });
  }
}
