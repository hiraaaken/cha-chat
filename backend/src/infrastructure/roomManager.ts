import crypto from 'node:crypto';
import { type Result, err, ok } from 'neverthrow';
import type { RoomManagerInterface } from '../application/interfaces/roomManagerInterface';
import type { MessageServiceInterface } from '../application/interfaces/messageServiceInterface';
import { type ActiveChatRoom, createActiveChatRoom } from '../domain/entities/chatRoom';
import type { ChatRoom, RoomCloseReason } from '../domain/entities/chatRoom';
import { RoomError } from '../domain/types/errors';
import { type RoomId, type SessionId, RoomId as toRoomId } from '../domain/types/valueObjects';

const ROOM_DURATION_MS = 10 * 60 * 1000; // 10分
const TIMER_UPDATE_INTERVAL_MS = 60 * 1000; // 1分

type BroadcastFn = (roomId: string, event: string, payload: unknown) => void;

interface RoomTimers {
  readonly timeout: NodeJS.Timeout;
  readonly interval: NodeJS.Timeout;
}

export class InMemoryRoomManager implements RoomManagerInterface {
  private readonly rooms: Map<string, ActiveChatRoom> = new Map();
  private readonly timers: Map<string, RoomTimers> = new Map();

  constructor(
    private readonly messageService: MessageServiceInterface = createNoopMessageService(),
    private readonly broadcast: BroadcastFn = () => {}
  ) {}

  async createRoom(
    user1SessionId: SessionId,
    user2SessionId: SessionId
  ): Promise<Result<RoomId, RoomError>> {
    const roomIdResult = toRoomId(crypto.randomUUID());
    if (roomIdResult.isErr()) {
      return err(new RoomError('ROOM_DATABASE_ERROR', 'ルームIDの生成に失敗しました'));
    }

    const roomId = roomIdResult.value;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ROOM_DURATION_MS);
    const room = createActiveChatRoom(roomId, user1SessionId, user2SessionId, now, expiresAt);

    this.rooms.set(roomId as string, room);

    // タイムアウトタイマー: 10分後に roomClosed(timeout) を発火
    const timeout = setTimeout(async () => {
      await this.closeRoom(roomId, 'timeout');
    }, ROOM_DURATION_MS);

    // timerUpdate インターバル: 1分ごとに残り時間をブロードキャスト
    const interval = setInterval(() => {
      const currentRoom = this.rooms.get(roomId as string);
      if (!currentRoom) return;
      const remainingSeconds = Math.max(
        0,
        Math.round((currentRoom.expiresAt.getTime() - Date.now()) / 1000)
      );
      this.broadcast(roomId as string, 'timerUpdate', { roomId: roomId as string, remainingSeconds });
    }, TIMER_UPDATE_INTERVAL_MS);

    this.timers.set(roomId as string, { timeout, interval });

    return ok(roomId);
  }

  async closeRoom(roomId: RoomId, reason: RoomCloseReason): Promise<Result<void, RoomError>> {
    const room = this.rooms.get(roomId as string);
    if (!room) {
      return err(new RoomError('ROOM_NOT_FOUND', 'ルームが見つかりません'));
    }

    // タイマークリア
    const timers = this.timers.get(roomId as string);
    if (timers) {
      clearTimeout(timers.timeout);
      clearInterval(timers.interval);
      this.timers.delete(roomId as string);
    }

    // ルームをメモリから削除
    this.rooms.delete(roomId as string);

    // メッセージ削除（エラーは無視してroomClosedを発火する）
    await this.messageService.deleteAllMessages(roomId);

    // roomClosed ブロードキャスト
    this.broadcast(roomId as string, 'roomClosed', { roomId: roomId as string, reason });

    return ok(undefined);
  }

  getRoom(roomId: RoomId): Result<ChatRoom, RoomError> {
    const room = this.rooms.get(roomId as string);
    if (!room) {
      return err(new RoomError('ROOM_NOT_FOUND', 'ルームが見つかりません'));
    }
    return ok(room);
  }

  getRoomBySessionId(sessionId: SessionId): Result<ActiveChatRoom, RoomError> {
    const room = [...this.rooms.values()].find(
      (r) => r.user1SessionId === sessionId || r.user2SessionId === sessionId
    );
    if (!room) {
      return err(new RoomError('ROOM_NOT_FOUND', 'セッションIDに対応するルームが見つかりません'));
    }
    return ok(room);
  }

  async handleUserDisconnect(
    sessionId: SessionId,
    roomId: RoomId
  ): Promise<Result<void, RoomError>> {
    // 切断者のパートナーに通知（切断者はすでにroomから抜けている想定）
    this.broadcast(roomId as string, 'partnerDisconnected', { roomId: roomId as string });

    // roomClosed もcloseRoom内で発火する
    return this.closeRoom(roomId, 'user_left');
  }
}

// messageService未注入時のno-op実装（テスト後方互換用）
function createNoopMessageService(): MessageServiceInterface {
  return {
    sendMessage: async () => {
      throw new Error('messageService not injected');
    },
    deleteAllMessages: async () => ok(undefined),
    getMessages: async () => {
      throw new Error('messageService not injected');
    },
  };
}
