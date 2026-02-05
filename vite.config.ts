import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // 1. 核心修复：强制使用相对路径。
    // 这将使资源引用从 "/assets/..." 变为 "./assets/..."
    base: './',

    plugins: [react()],

    // 2. 注入环境变量到代码中
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },

    resolve: {
      alias: {
        // 3. 路径别名修复：确保 @ 指向项目根目录，匹配你的 tsconfig.json
        '@': path.resolve(__dirname, './'),
      }
    },

    server: {
      port: 3000,
      host: '0.0.0.0',
    }
  };
});
