import type { Result } from 'neverthrow';
import type { ActiveChatRoom, ChatRoom, RoomCloseReason } from '../../domain/entities/chatRoom';
import type { RoomError } from '../../domain/types/errors';
import type { RoomId, SessionId } from '../../domain/types/valueObjects';

export interface RoomManagerInterface {
  createRoom(
    user1SessionId: SessionId,
    user2SessionId: SessionId
  ): Promise<Result<RoomId, RoomError>>;
  closeRoom(roomId: RoomId, reason: RoomCloseReason): Promise<Result<void, RoomError>>;
  getRoom(roomId: RoomId): Result<ChatRoom, RoomError>;
  getRoomBySessionId(sessionId: SessionId): Result<ActiveChatRoom, RoomError>;
  handleUserDisconnect(sessionId: SessionId, roomId: RoomId): Promise<Result<void, RoomError>>;
}
