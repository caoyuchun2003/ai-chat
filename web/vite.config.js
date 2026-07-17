import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 自定义域 chat.yuchuntest.com 挂在根路径
export default defineConfig({
  plugins: [react()],
  base: '/',
})
