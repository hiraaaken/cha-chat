import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

/**
 * Honoサーバーの初期化と設定
 */
export function createHonoServer() {
  const app = new Hono();

  // ミドルウェアの設定
  app.use('*', logger());
  app.use('*', cors());

  // ヘルスチェックエンドポイント
  app.get('/health', (c) => {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'cha-chat-backend',
    });
  });

  return app;
}
