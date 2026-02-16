import type { RoomId, SessionId } from '../types/valueObjects';

// --- ChatRoom: Union型で状態を表現 ---
export type ChatRoom = ActiveChatRoom | ClosedChatRoom;

interface _ChatRoom {
  id: RoomId;
  user1SessionId: SessionId;
  user2SessionId: SessionId;
  createdAt: Date;
  expiresAt: Date;
}

export interface ActiveChatRoom extends _ChatRoom {
  readonly _tag: 'ActiveChatRoom';
}

export interface ClosedChatRoom extends _ChatRoom {
  readonly _tag: 'ClosedChatRoom';
  readonly closedAt: Date;
  readonly closeReason: RoomCloseReason;
}

export type RoomCloseReason = 'timeout' | 'user_left' | 'reported';

// --- ファクトリ関数 ---
export function createActiveChatRoom(
  id: RoomId,
  user1SessionId: SessionId,
  user2SessionId: SessionId,
  createdAt: Date,
  expiresAt: Date
): ActiveChatRoom {
  return {
    id,
    user1SessionId,
    user2SessionId,
    createdAt,
    expiresAt,
    _tag: 'ActiveChatRoom',
  };
}

export function closeChatRoom(room: ActiveChatRoom, reason: RoomCloseReason): ClosedChatRoom {
  return {
    ...room,
    _tag: 'ClosedChatRoom',
    closedAt: new Date(),
    closeReason: reason,
  };
}
