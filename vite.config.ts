import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // 监听所有主机
    port: 5173, // 明确设置端口
    strictPort: false, // 禁用严格端口检查
    cors: true, // 允许跨域请求
    open: true, // 自动打开浏览器
    proxy: {
      // 为阿里云API添加代理，解决CORS问题
      '/api/v1/services/aigc/text2image/generation': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
      },
      // 为/api/image-generation路径添加代理，解决旧代码的兼容性问题
      '/api/image-generation': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => '/api/v1/images/generations',
      },
    },
  },
})
