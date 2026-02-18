import crypto from 'node:crypto';
import { type Result, err, ok } from 'neverthrow';
import type { RoomManagerInterface } from '../application/interfaces/roomManagerInterface';
import { type ActiveChatRoom, createActiveChatRoom } from '../domain/entities/chatRoom';
import type { ChatRoom } from '../domain/entities/chatRoom';
import { RoomError } from '../domain/types/errors';
import { type RoomId, type SessionId, RoomId as toRoomId } from '../domain/types/valueObjects';

const ROOM_DURATION_MS = 10 * 60 * 1000; // 10分

export class InMemoryRoomManager implements RoomManagerInterface {
  private readonly rooms: Map<string, ActiveChatRoom> = new Map();

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
    return ok(roomId);
  }

  getRoom(roomId: RoomId): Result<ChatRoom, RoomError> {
    const room = this.rooms.get(roomId as string);
    if (!room) {
      return err(new RoomError('ROOM_NOT_FOUND', 'ルームが見つかりません'));
    }
    return ok(room);
  }
}
