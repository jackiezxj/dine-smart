// 用于将API key存储到Supabase数据库的迁移脚本
// 使用方法：在控制台中运行 `node migrateApiKey.js` 并按照提示输入API key

import { supabase } from './supabase';

/**
 * 将API key存储到Supabase数据库
 * @param apiKey 阿里云API key
 */
const migrateApiKey = async (apiKey: string) => {
  try {
    // 检查settings表是否存在，如果不存在则创建
    // 注意：在实际生产环境中，应该使用Supabase的迁移工具来创建表
    // 这里为了简化，我们直接尝试插入数据，如果表不存在会报错
    
    // 检查是否已有API key记录
    const { data: existingData, error: fetchError } = await supabase
      .from('settings')
      .select('id')
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // 如果不是"找不到记录"的错误，则抛出
      throw fetchError;
    }

    if (existingData) {
      // 更新现有记录
      const { error: updateError } = await supabase
        .from('settings')
        .update({ ai_image_api_key: apiKey })
        .eq('id', existingData.id);

      if (updateError) {
        throw updateError;
      }

      console.log('✓ API key已成功更新到Supabase数据库');
    } else {
      // 插入新记录
      const { error: insertError } = await supabase
        .from('settings')
        .insert({ ai_image_api_key: apiKey });

      if (insertError) {
        throw insertError;
      }

      console.log('✓ API key已成功插入到Supabase数据库');
    }
  } catch (error) {
    console.error('✗ 存储API key时发生错误:', error);
    console.error('请确保Supabase连接配置正确，并且settings表已创建');
    console.error('settings表结构建议:');
    console.error('id (uuid, primary key)');
    console.error('ai_image_api_key (text)');
    console.error('created_at (timestamp)');
    console.error('updated_at (timestamp)');
  }
};

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  // 在浏览器环境中，我们需要通过UI来获取API key
  // 在Node.js环境中，我们可以通过命令行获取
  if (typeof window === 'undefined') {
    // Node.js环境
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('请输入阿里云API key: ', (apiKey: string) => {
      migrateApiKey(apiKey.trim()).then(() => {
        readline.close();
        process.exit(0);
      });
    });
  } else {
    // 浏览器环境
    console.log('请在Node.js环境中运行此脚本，或直接在Supabase控制台中添加API key');
  }
}

export { migrateApiKey };