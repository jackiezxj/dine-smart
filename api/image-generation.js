// 使用CommonJS的导入格式
const { createClient } = require('@supabase/supabase-js');

// 创建Supabase客户端
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 添加CORS头部
function addCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// 处理OPTIONS请求
if (process.env.NODE_ENV === 'development') {
  console.log('API route initialized');
}

// 使用CommonJS的导出格式
module.exports = async function handler(request, response) {
  // 添加CORS头部
  addCorsHeaders(response);

  // 处理OPTIONS请求
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // 只允许POST请求
  if (request.method !== 'POST') {
    console.error('Method not allowed:', request.method);
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    console.log('Received request:', request.method, request.url);
    console.log('Request headers:', request.headers);

    // 从请求体获取描述
    let requestBody;
    try {
      requestBody = await new Promise((resolve, reject) => {
        let body = '';
        request.on('data', chunk => {
          body += chunk.toString();
        });
        request.on('end', () => {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch (err) {
            reject(new Error('Invalid JSON body'));
          }
        });
        request.on('error', reject);
      });
      console.log('Request body:', requestBody);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return response.status(400).json({ error: 'Invalid JSON body' });
    }

    const { description } = requestBody;
    
    if (!description || description.length > 30) {
      console.error('Invalid description:', description);
      return response.status(400).json({ error: '描述不能为空且不能超过30字' });
    }

    // 从Supabase获取API密钥
    console.log('Fetching API key from Supabase...');
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('service_name', 'aliyun_dashscope')
      .limit(1)
      .maybeSingle();

    if (apiKeyError) {
      console.error('Failed to fetch API key:', apiKeyError);
      return response.status(500).json({ error: '获取API密钥失败' });
    }

    if (!apiKeyData) {
      console.error('API key not found');
      return response.status(500).json({ error: '未找到API密钥' });
    }

    const apiKey = apiKeyData.api_key;
    console.log('API key fetched successfully');

    // 调用阿里云DashScope API生成图片
    console.log('Calling Aliyun DashScope API...');
    const apiResponse = await fetch('https://dashscope.aliyuncs.com/api/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "model": "qwen-image-max",
        "input": {
          "prompt": `你是一个专业的美食视觉生成模型，擅长将简短的文字描述转化为高质量、极具食欲感的美食图片。\n任务规则：\n用户将输入一段不超过30字的中文描述。\n首先判断输入内容是否与"食物 / 菜品 / 饮品 / 美食场景"直接相关。\n若不相关（如人物、风景、情绪、抽象概念等），请不要生成图片，而是直接返回以下固定提示：\n「请输入与食物相关的描述，例如菜品、口味、食材或烹饪方式。」\n若输入内容与美食相关，请基于用户描述生成一幅美食图片，并遵循以下生成要求：\n美食图片生成要求：\n画面主体必须是清晰、具体的食物或菜品\n风格偏向真实美食摄影 / 高级餐饮宣传图\n强调：\n食材质感（油润、酥脆、嫩滑、多汁等）\n色泽诱人（温暖光线、自然高饱和但不失真）\n新鲜感与"刚出锅 / 刚上桌"的状态\n构图干净，背景简洁或虚化，避免杂乱\n光影自然，突出美食细节，让人一看就产生食欲、垂涎欲滴\n不出现人物正脸、不出现文字、水印、logo\n输出要求：\n仅生成一幅符合描述的美食图片\n不附加解释性文字，不重复用户输入内容\n可选：如果你希望"更偏商业级效果"，可在末尾追加一句\n整体效果应达到「高端美食网站首页主图 / 外卖平台爆款菜品封面」的视觉水准。\n\n用户输入：${description}`
        },
        "parameters": {
          "size": "720x1280", // 9:16 长图
          "n": 1
        }
      })
    });

    console.log('API response status:', apiResponse.status);
    console.log('API response headers:', apiResponse.headers);

    const data = await apiResponse.json();
    console.log('API response data:', data);

    if (!apiResponse.ok) {
      console.error('API error:', data);
      return response.status(apiResponse.status).json({ error: data.message || '生成图片失败' });
    }

    if (data.output && data.output.results && data.output.results.length > 0) {
      console.log('Image generated successfully:', data.output.results[0].url);
      return response.status(200).json({ imageUrl: data.output.results[0].url });
    } else {
      console.error('Invalid API response:', data);
      return response.status(500).json({ error: '生成图片失败，请重试' });
    }
  } catch (error) {
    console.error('Error generating image:', error);
    return response.status(500).json({ error: '生成图片失败，请检查网络连接并重试' });
  }
}
