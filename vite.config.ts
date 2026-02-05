import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: './', // 解决之前的 404 问题
    plugins: [react()],
    define: {
      // 核心修复：防止浏览器因为找不到 process 而白屏
      'process.env': {},
      // 兼容某些 SDK 可能使用的环境变量格式
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      }
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
    }
  };
});
