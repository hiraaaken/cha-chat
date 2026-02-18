import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import type { Socket } from 'socket.io';
import type { EnqueueUser } from '../../application/interfaces/matchingServiceInterface';
import type { SessionManagerInterface } from '../../application/interfaces/sessionManagerInterface';
import type { SessionId } from '../../domain/types/valueObjects';
import { SocketId } from '../../domain/types/valueObjects';

/**
 * requestMatchイベントのハンドラ
 * セッションIDに紐づくユーザーをマッチングキューに追加し、
 * 成功時はwaitingイベント、失敗時はerrorイベントを発行する
 */
export async function handleRequestMatch(
  socket: Pick<Socket, 'emit'>,
  sessionId: SessionId,
  enqueueUser: EnqueueUser
): Promise<void> {
  const result = await enqueueUser(sessionId);
  result.match(
    () => {
      socket.emit('waiting');
    },
    (error) => {
      socket.emit('error', { code: error.code, message: error.message });
    }
  );
}

/**
 * WebSocket接続イベントのハンドラ
 * 接続時にセッションを生成し、requestMatch・disconnectイベントを登録する
 */
export function handleConnection(
  socket: Pick<Socket, 'id' | 'data' | 'emit' | 'on' | 'disconnect'>,
  sessionManager: SessionManagerInterface,
  enqueueUser: EnqueueUser
): void {
  const socketIdResult = SocketId(socket.id);
  if (socketIdResult.isErr()) {
    socket.emit('error', { code: 'SESSION_ERROR', message: 'セッション生成に失敗しました' });
    socket.disconnect();
    return;
  }

  const sessionResult = sessionManager.generateSession(socketIdResult.value);
  if (sessionResult.isErr()) {
    socket.emit('error', { code: 'SESSION_ERROR', message: 'セッション生成に失敗しました' });
    socket.disconnect();
    return;
  }

  const session = sessionResult.value;

  socket.on('requestMatch', async () => {
    await handleRequestMatch(socket, session.sessionId, enqueueUser);
  });

  socket.on('disconnect', () => {
    sessionManager.invalidateSession(session.sessionId);
  });
}

/**
 * WebSocket Gatewayの生成
 * Socket.IOサーバーを初期化し、接続イベントにハンドラを登録する
 */
export function createWebSocketGateway(
  httpServer: HttpServer,
  sessionManager: SessionManagerInterface,
  enqueueUser: EnqueueUser
): Server {
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket: Socket) => {
    handleConnection(socket, sessionManager, enqueueUser);
  });

  return io;
}
