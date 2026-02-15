import crypto from 'node:crypto';
import { type Result, err, ok } from 'neverthrow';
import type { SessionManagerInterface } from '../application/interfaces/sessionManagerInterface';
import { type Session, createSession } from '../domain/entities/session';
import { SessionError } from '../domain/types/errors';
import { type SessionId, type SocketId, SessionId as toSessionId } from '../domain/types/valueObjects';

function sessionNotFoundError(): SessionError {
  return new SessionError('SESSION_NOT_FOUND', 'セッションが見つかりません');
}

export class InMemorySessionManager implements SessionManagerInterface {
  private readonly sessions: Map<string, Session> = new Map();

  generateSession(socketId: SocketId): Result<Session, SessionError> {
    return toSessionId(crypto.randomUUID())
      .mapErr(() => new SessionError('SESSION_NOT_FOUND', 'セッションIDの生成に失敗しました'))
      .map((sessionId) => {
        const session = createSession(sessionId, socketId, new Date());
        this.sessions.set(sessionId as string, session);
        return session;
      });
  }

  getSession(sessionId: SessionId): Result<Session, SessionError> {
    const session = this.sessions.get(sessionId as string);
    if (!session) {
      return err(sessionNotFoundError());
    }
    return ok(session);
  }

  invalidateSession(sessionId: SessionId): Result<void, SessionError> {
    if (!this.sessions.has(sessionId as string)) {
      return err(sessionNotFoundError());
    }
    this.sessions.delete(sessionId as string);
    return ok(undefined);
  }

  bindSocketToSession(sessionId: SessionId, socketId: SocketId): Result<void, SessionError> {
    const session = this.sessions.get(sessionId as string);
    if (!session) {
      return err(sessionNotFoundError());
    }
    const updated: Session = { ...session, socketId };
    this.sessions.set(sessionId as string, updated);
    return ok(undefined);
  }
}
