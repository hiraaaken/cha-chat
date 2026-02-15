import type { RoomId, SessionId, SocketId } from '../types/valueObjects';

export interface Session {
  sessionId: SessionId;
  socketId: SocketId;
  createdAt: Date;
}

// --- マッチング状態: Union型で表現 ---
export type MatchingStatus = Waiting | Matched;

export interface Waiting {
  status: 'waiting';
  sessionId: SessionId;
  enqueuedAt: Date;
}

export interface Matched {
  status: 'matched';
  sessionId: SessionId;
  roomId: RoomId;
  matchedAt: Date;
}

// --- ファクトリ関数 ---
export function createSession(sessionId: SessionId, socketId: SocketId, createdAt: Date): Session {
  return { sessionId, socketId, createdAt };
}

export function createWaiting(sessionId: SessionId, enqueuedAt: Date): Waiting {
  return { status: 'waiting', sessionId, enqueuedAt };
}

export function createMatched(sessionId: SessionId, roomId: RoomId, matchedAt: Date): Matched {
  return { status: 'matched', sessionId, roomId, matchedAt };
}
