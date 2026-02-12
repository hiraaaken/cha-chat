import { serve } from '@hono/node-server';
import { createHonoServer } from './infrastructure/http/honoServer';

// 環境変数の読み込み
const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Honoサーバーの作成
const app = createHonoServer();

// サーバーの起動
console.log(`🚀 Starting server in ${NODE_ENV} mode...`);

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`✅ Server is running on http://localhost:${info.port}`);
    console.log(`📡 Health check: http://localhost:${info.port}/health`);
  }
);
