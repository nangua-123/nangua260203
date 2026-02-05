import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 从当前环境加载变量 (如腾讯云控制台配置的 GEMINI_API_KEY)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: './', // 核心：解决 404 路径问题
    
    plugins: [react()],

    define: {
      // 核心：修复 "process is not defined" 导致的白屏
      'process.env': {}, 
      // 核心：将 API Key 注入为 Vite 识别的格式
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        // 匹配你的 tsconfig.json 路径别名
        '@': path.resolve(__dirname, './'),
      }
    },

    server: {
      port: 3000,
      host: '0.0.0.0',
    }
  };
});
