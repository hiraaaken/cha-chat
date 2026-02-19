import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import type { Socket } from 'socket.io';
import type { EnqueueUser, TryMatch } from '../../application/interfaces/matchingServiceInterface';
import type { MessageServiceInterface } from '../../application/interfaces/messageServiceInterface';
import type { SessionManagerInterface } from '../../application/interfaces/sessionManagerInterface';
import type { SessionId } from '../../domain/types/valueObjects';
import { MessageText, RoomId, SocketId } from '../../domain/types/valueObjects';

/** Gateway が持つソケット操作コールバックのセット */
export interface SocketOperations {
  emitToSocket: (socketId: string, event: string, payload: unknown) => void;
  joinSocketToRoom: (socketId: string, roomId: string) => void;
  broadcastToRoom: (roomId: string, event: string, payload: unknown) => void;
}

/**
 * requestMatchイベントのハンドラ
 * エンキュー → 待機通知 → tryMatch → マッチ成立時に両ユーザーを room に参加させ matchFound を発行する
 */
export async function handleRequestMatch(
  socket: Pick<Socket, 'emit'>,
  sessionId: SessionId,
  enqueueUser: EnqueueUser,
  tryMatch: TryMatch,
  sessionManager: SessionManagerInterface,
  ops: SocketOperations
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
    const socketId = user1SessionResult.value.socketId as string;
    ops.joinSocketToRoom(socketId, roomId as string);
    ops.emitToSocket(socketId, 'matchFound', {
      roomId: roomId as string,
      partnerSessionId: user2SessionId as string,
    });
  }

  if (user2SessionResult.isOk()) {
    const socketId = user2SessionResult.value.socketId as string;
    ops.joinSocketToRoom(socketId, roomId as string);
    ops.emitToSocket(socketId, 'matchFound', {
      roomId: roomId as string,
      partnerSessionId: user1SessionId as string,
    });
  }
}

/**
 * sendMessageイベントのハンドラ
 * ペイロードを検証 → MessageService.sendMessage() → newMessage ブロードキャスト
 * 自動削除が発生した場合は messageDeleted もブロードキャスト
 */
export async function handleSendMessage(
  socket: Pick<Socket, 'emit'>,
  sessionId: SessionId,
  payload: { roomId: string; text: string },
  messageService: MessageServiceInterface,
  ops: SocketOperations
): Promise<void> {
  const roomIdResult = RoomId(payload.roomId);
  if (roomIdResult.isErr()) {
    socket.emit('error', { code: 'VALIDATION_ERROR', message: '無効なルームIDです' });
    return;
  }

  const textResult = MessageText(payload.text);
  if (textResult.isErr()) {
    socket.emit('error', { code: 'VALIDATION_ERROR', message: textResult.error.message });
    return;
  }

  const result = await messageService.sendMessage(sessionId, roomIdResult.value, textResult.value);
  if (result.isErr()) {
    socket.emit('error', { code: result.error.code, message: result.error.message });
    return;
  }

  const { message, deletedMessageId } = result.value;

  ops.broadcastToRoom(payload.roomId, 'newMessage', {
    messageId: message.id as string,
    senderSessionId: message.senderSessionId as string,
    text: message.text as string,
    createdAt: message.createdAt.toISOString(),
  });

  if (deletedMessageId !== null) {
    ops.broadcastToRoom(payload.roomId, 'messageDeleted', {
      messageId: deletedMessageId as string,
    });
  }
}

/**
 * WebSocket接続イベントのハンドラ
 * 接続時にセッションを生成し、requestMatch・sendMessage・disconnectイベントを登録する
 */
export function handleConnection(
  socket: Pick<Socket, 'id' | 'data' | 'emit' | 'on' | 'disconnect'>,
  sessionManager: SessionManagerInterface,
  enqueueUser: EnqueueUser,
  tryMatch: TryMatch,
  messageService: MessageServiceInterface,
  ops: SocketOperations
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
    await handleRequestMatch(socket, session.sessionId, enqueueUser, tryMatch, sessionManager, ops);
  });

  socket.on('sendMessage', async (payload: { roomId: string; text: string }) => {
    await handleSendMessage(socket, session.sessionId, payload, messageService, ops);
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
  tryMatch: TryMatch,
  messageService: MessageServiceInterface
): Server {
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  const ops: SocketOperations = {
    emitToSocket: (socketId, event, payload) => {
      io.sockets.sockets.get(socketId)?.emit(event, payload);
    },
    joinSocketToRoom: (socketId, roomId) => {
      io.sockets.sockets.get(socketId)?.join(roomId);
    },
    broadcastToRoom: (roomId, event, payload) => {
      io.to(roomId).emit(event, payload);
    },
  };

  io.on('connection', (socket: Socket) => {
    handleConnection(socket, sessionManager, enqueueUser, tryMatch, messageService, ops);
  });

  return io;
}
