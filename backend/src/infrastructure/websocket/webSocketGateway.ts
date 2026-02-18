import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import type { Socket } from 'socket.io';
import type { EnqueueUser, TryMatch } from '../../application/interfaces/matchingServiceInterface';
import type { SessionManagerInterface } from '../../application/interfaces/sessionManagerInterface';
import type { SessionId } from '../../domain/types/valueObjects';
import { SocketId } from '../../domain/types/valueObjects';

type EmitToSocket = (socketId: string, event: string, payload: unknown) => void;

/**
 * requestMatchイベントのハンドラ
 * エンキュー → 待機通知 → tryMatch → マッチ成立時に両ユーザーへ matchFound を発行する
 */
export async function handleRequestMatch(
  socket: Pick<Socket, 'emit'>,
  sessionId: SessionId,
  enqueueUser: EnqueueUser,
  tryMatch: TryMatch,
  sessionManager: SessionManagerInterface,
  emitToSocket: EmitToSocket
): Promise<void> {
  const enqueueResult = await enqueueUser(sessionId);
  if (enqueueResult.isErr()) {
    socket.emit('error', {
      code: enqueueResult.error.code,
      message: enqueueResult.error.message,
    });
    return;
  }

  socket.emit('waiting');

  const matchResult = await tryMatch();
  if (matchResult.isErr() || matchResult.value === null) {
    return;
  }

  const { roomId, user1SessionId, user2SessionId } = matchResult.value;

  const user1SessionResult = sessionManager.getSession(user1SessionId);
  const user2SessionResult = sessionManager.getSession(user2SessionId);

  if (user1SessionResult.isOk()) {
    emitToSocket(user1SessionResult.value.socketId as string, 'matchFound', {
      roomId: roomId as string,
      partnerSessionId: user2SessionId as string,
    });
  }

  if (user2SessionResult.isOk()) {
    emitToSocket(user2SessionResult.value.socketId as string, 'matchFound', {
      roomId: roomId as string,
      partnerSessionId: user1SessionId as string,
    });
  }
}

/**
 * WebSocket接続イベントのハンドラ
 * 接続時にセッションを生成し、requestMatch・disconnectイベントを登録する
 */
export function handleConnection(
  socket: Pick<Socket, 'id' | 'data' | 'emit' | 'on' | 'disconnect'>,
  sessionManager: SessionManagerInterface,
  enqueueUser: EnqueueUser,
  tryMatch: TryMatch,
  emitToSocket: EmitToSocket
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
    await handleRequestMatch(
      socket,
      session.sessionId,
      enqueueUser,
      tryMatch,
      sessionManager,
      emitToSocket
    );
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
  enqueueUser: EnqueueUser,
  tryMatch: TryMatch
): Server {
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  const emitToSocket: EmitToSocket = (socketId, event, payload) => {
    io.sockets.sockets.get(socketId)?.emit(event, payload);
  };

  io.on('connection', (socket: Socket) => {
    handleConnection(socket, sessionManager, enqueueUser, tryMatch, emitToSocket);
  });

  return io;
}
