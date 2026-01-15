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
  },
})
