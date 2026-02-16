import type { RoomId, SessionId, SocketId } from '../types/valueObjects';

export interface Session {
  sessionId: SessionId;
  socketId: SocketId;
  createdAt: Date;
}

// --- マッチング状態: Union型で表現 ---
export type MatchingStatus = Waiting | Matched;

export interface Waiting {
  readonly _tag: 'Waiting';
  readonly sessionId: SessionId;
  readonly enqueuedAt: Date;
}

export interface Matched {
  readonly _tag: 'Matched';
  readonly sessionId: SessionId;
  readonly roomId: RoomId;
  readonly matchedAt: Date;
}

// --- ファクトリ関数 ---
export function createSession(sessionId: SessionId, socketId: SocketId, createdAt: Date): Session {
  return { sessionId, socketId, createdAt };
}

export function createWaiting(sessionId: SessionId, enqueuedAt: Date): Waiting {
  return { _tag: 'Waiting', sessionId, enqueuedAt };
}

export function createMatched(sessionId: SessionId, roomId: RoomId, matchedAt: Date): Matched {
  return { _tag: 'Matched', sessionId, roomId, matchedAt };
}
