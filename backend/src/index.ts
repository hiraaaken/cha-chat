import type { Server as HttpServer } from 'node:http';
import { serve } from '@hono/node-server';
import { createEnqueueUser } from './application/services/enqueueUser';
import { createTryMatch } from './application/services/tryMatch';
import { createHonoServer } from './infrastructure/http/honoServer';
import { InMemoryMatchingQueue } from './infrastructure/matchingQueue';
import { InMemoryRoomManager } from './infrastructure/roomManager';
import { InMemorySessionManager } from './infrastructure/sessionManager';
import { createWebSocketGateway } from './infrastructure/websocket/webSocketGateway';

// 環境変数の読み込み
const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Honoサーバーの作成
const app = createHonoServer();

// サーバーの起動
console.log(`🚀 Starting server in ${NODE_ENV} mode...`);

const httpServer = serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`✅ Server is running on http://localhost:${info.port}`);
    console.log(`📡 Health check: http://localhost:${info.port}/health`);
    console.log(`🔌 WebSocket: ws://localhost:${info.port}`);
  }
);

// 依存関係の初期化
const sessionManager = new InMemorySessionManager();
const matchingQueue = new InMemoryMatchingQueue();
const roomManager = new InMemoryRoomManager();
const enqueueUser = createEnqueueUser(matchingQueue);
const tryMatch = createTryMatch(matchingQueue, roomManager);

// WebSocket Gatewayの起動
// @hono/node-server の serve() は HTTP サーバーを返すため HttpServer にキャスト
createWebSocketGateway(httpServer as HttpServer, sessionManager, enqueueUser, tryMatch);
