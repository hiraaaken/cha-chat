import type { Result } from 'neverthrow';
import type { Session } from '../../domain/entities/session';
import type { SessionError } from '../../domain/types/errors';
import type { SessionId, SocketId } from '../../domain/types/valueObjects';

export interface SessionManagerInterface {
  generateSession(socketId: SocketId): Result<Session, SessionError>;
  getSession(sessionId: SessionId): Result<Session, SessionError>;
  invalidateSession(sessionId: SessionId): Result<void, SessionError>;
  bindSocketToSession(sessionId: SessionId, socketId: SocketId): Result<void, SessionError>;
}
