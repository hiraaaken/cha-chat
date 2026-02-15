import { describe, expect, it } from 'vitest';
import { SessionId, SocketId } from '../domain/types/valueObjects';
import { InMemorySessionManager } from './sessionManager';

describe('InMemorySessionManager', () => {
  const createManager = () => new InMemorySessionManager();
  const testSocketId = SocketId('socket-abc-123')._unsafeUnwrap();
  const anotherSocketId = SocketId('socket-xyz-789')._unsafeUnwrap();

  describe('generateSession', () => {
    it('セッションを生成できる', () => {
      const manager = createManager();
      const result = manager.generateSession(testSocketId);

      expect(result.isOk()).toBe(true);
      const session = result._unsafeUnwrap();
      expect(session.sessionId).toBeDefined();
      expect(session.socketId).toBe(testSocketId);
      expect(session.createdAt).toBeInstanceOf(Date);
    });

    it('生成されたSessionIdはUUID v4形式である', () => {
      const manager = createManager();
      const session = manager.generateSession(testSocketId)._unsafeUnwrap();
      const uuidV4Regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(uuidV4Regex.test(session.sessionId as string)).toBe(true);
    });

    it('複数回呼び出すと異なるセッションIDが生成される', () => {
      const manager = createManager();
      const session1 = manager.generateSession(testSocketId)._unsafeUnwrap();
      const session2 = manager.generateSession(anotherSocketId)._unsafeUnwrap();

      expect(session1.sessionId).not.toBe(session2.sessionId);
    });
  });

  describe('getSession', () => {
    it('存在するセッションを取得できる', () => {
      const manager = createManager();
      const created = manager.generateSession(testSocketId)._unsafeUnwrap();
      const result = manager.getSession(created.sessionId);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(created);
    });

    it('存在しないセッションはSESSION_NOT_FOUNDを返す', () => {
      const manager = createManager();
      const unknownId = SessionId('00000000-0000-4000-a000-000000000000')._unsafeUnwrap();
      const result = manager.getSession(unknownId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('SESSION_NOT_FOUND');
    });
  });

  describe('invalidateSession', () => {
    it('セッションを無効化できる', () => {
      const manager = createManager();
      const session = manager.generateSession(testSocketId)._unsafeUnwrap();
      const result = manager.invalidateSession(session.sessionId);

      expect(result.isOk()).toBe(true);
    });

    it('存在しないセッションの無効化はSESSION_NOT_FOUNDを返す', () => {
      const manager = createManager();
      const unknownId = SessionId('00000000-0000-4000-a000-000000000000')._unsafeUnwrap();
      const result = manager.invalidateSession(unknownId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('SESSION_NOT_FOUND');
    });

    it('無効化後にgetSessionするとSESSION_NOT_FOUNDを返す', () => {
      const manager = createManager();
      const session = manager.generateSession(testSocketId)._unsafeUnwrap();
      manager.invalidateSession(session.sessionId);
      const result = manager.getSession(session.sessionId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('SESSION_NOT_FOUND');
    });
  });

  describe('bindSocketToSession', () => {
    it('新しいSocketIdをバインドできる', () => {
      const manager = createManager();
      const session = manager.generateSession(testSocketId)._unsafeUnwrap();
      const bindResult = manager.bindSocketToSession(session.sessionId, anotherSocketId);

      expect(bindResult.isOk()).toBe(true);

      const updated = manager.getSession(session.sessionId)._unsafeUnwrap();
      expect(updated.socketId).toBe(anotherSocketId);
    });

    it('存在しないセッションへのバインドはSESSION_NOT_FOUNDを返す', () => {
      const manager = createManager();
      const unknownId = SessionId('00000000-0000-4000-a000-000000000000')._unsafeUnwrap();
      const result = manager.bindSocketToSession(unknownId, testSocketId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('SESSION_NOT_FOUND');
    });
  });
});
