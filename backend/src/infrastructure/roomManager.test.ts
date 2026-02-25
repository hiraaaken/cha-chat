import { ok } from 'neverthrow';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MessageServiceInterface } from '../application/interfaces/messageServiceInterface';
import { RoomId, SessionId } from '../domain/types/valueObjects';
import { InMemoryRoomManager } from './roomManager';

const user1 = SessionId('00000000-0000-4000-a000-000000000001')._unsafeUnwrap();
const user2 = SessionId('00000000-0000-4000-a000-000000000002')._unsafeUnwrap();

function createMockMessageService(): MessageServiceInterface {
  return {
    sendMessage: vi.fn(),
    deleteAllMessages: vi.fn().mockResolvedValue(ok(undefined)),
    getMessages: vi.fn(),
  };
}

describe('InMemoryRoomManager', () => {
  describe('createRoom', () => {
    it('2人のユーザーIDからルームを作成しRoomIdを返す', async () => {
      const manager = new InMemoryRoomManager();
      const result = await manager.createRoom(user1, user2);

      expect(result.isOk()).toBe(true);
      const roomId = result._unsafeUnwrap();
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidV4Regex.test(roomId as string)).toBe(true);
    });

    it('複数回呼び出すと異なるRoomIdが生成される', async () => {
      const manager = new InMemoryRoomManager();
      const result1 = await manager.createRoom(user1, user2);
      const result2 = await manager.createRoom(user1, user2);

      expect(result1._unsafeUnwrap()).not.toBe(result2._unsafeUnwrap());
    });

    it('作成されたルームはgetRoomで取得できる', async () => {
      const manager = new InMemoryRoomManager();
      const roomId = (await manager.createRoom(user1, user2))._unsafeUnwrap();
      const room = manager.getRoom(roomId)._unsafeUnwrap();

      expect(room._tag).toBe('ActiveChatRoom');
      expect(room.user1SessionId).toBe(user1);
      expect(room.user2SessionId).toBe(user2);
    });

    it('10分後のタイムアウトでroomClosedがbroadcastされる', async () => {
      vi.useFakeTimers();
      const broadcast = vi.fn();
      const messageService = createMockMessageService();
      const manager = new InMemoryRoomManager(messageService, broadcast);

      await manager.createRoom(user1, user2);

      // 10分+1ms進めてタイムアウトを発火
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000 + 1);

      expect(broadcast).toHaveBeenCalledWith(
        expect.any(String),
        'roomClosed',
        expect.objectContaining({ reason: 'timeout' })
      );
    });

    it('1分ごとにtimerUpdateがbroadcastされる', async () => {
      vi.useFakeTimers();
      const broadcast = vi.fn();
      const manager = new InMemoryRoomManager(createMockMessageService(), broadcast);

      await manager.createRoom(user1, user2);

      await vi.advanceTimersByTimeAsync(60 * 1000);
      expect(broadcast).toHaveBeenCalledWith(
        expect.any(String),
        'timerUpdate',
        expect.objectContaining({ remainingSeconds: expect.any(Number) })
      );
    });
  });

  describe('getRoom', () => {
    it('存在しないRoomIdはROOM_NOT_FOUNDを返す', async () => {
      const manager = new InMemoryRoomManager();
      const unknownRoomId = RoomId('00000000-0000-4000-a000-000000000099')._unsafeUnwrap();
      const result = manager.getRoom(unknownRoomId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('ROOM_NOT_FOUND');
    });
  });

  describe('closeRoom', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('closeRoomでタイマーがクリアされroomClosedがbroadcastされる', async () => {
      vi.useFakeTimers();
      const broadcast = vi.fn();
      const messageService = createMockMessageService();
      const manager = new InMemoryRoomManager(messageService, broadcast);

      const roomId = (await manager.createRoom(user1, user2))._unsafeUnwrap();
      broadcast.mockClear();

      const result = await manager.closeRoom(roomId, 'user_left');

      expect(result.isOk()).toBe(true);
      expect(messageService.deleteAllMessages).toHaveBeenCalledWith(roomId);
      expect(broadcast).toHaveBeenCalledWith(roomId as string, 'roomClosed', {
        roomId: roomId as string,
        reason: 'user_left',
      });

      // closeRoom後はタイムアウトが発火しない
      broadcast.mockClear();
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000 + 1);
      expect(broadcast).not.toHaveBeenCalledWith(expect.any(String), 'roomClosed', expect.any(Object));
    });

    it('存在しないroomIdにcloseRoomを呼ぶとROOM_NOT_FOUNDを返す', async () => {
      const manager = new InMemoryRoomManager();
      const unknownRoomId = RoomId('00000000-0000-4000-a000-000000000099')._unsafeUnwrap();

      const result = await manager.closeRoom(unknownRoomId, 'timeout');

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('ROOM_NOT_FOUND');
    });

    it('closeRoom後にgetRoomするとROOM_NOT_FOUNDになる', async () => {
      const manager = new InMemoryRoomManager(createMockMessageService());
      const roomId = (await manager.createRoom(user1, user2))._unsafeUnwrap();
      await manager.closeRoom(roomId, 'timeout');

      const result = manager.getRoom(roomId);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('ROOM_NOT_FOUND');
    });
  });

  describe('getRoomBySessionId', () => {
    it('user1SessionIdでルームを取得できる', async () => {
      const manager = new InMemoryRoomManager();
      const roomId = (await manager.createRoom(user1, user2))._unsafeUnwrap();

      const result = manager.getRoomBySessionId(user1);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().id).toBe(roomId);
    });

    it('user2SessionIdでルームを取得できる', async () => {
      const manager = new InMemoryRoomManager();
      const roomId = (await manager.createRoom(user1, user2))._unsafeUnwrap();

      const result = manager.getRoomBySessionId(user2);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().id).toBe(roomId);
    });

    it('存在しないSessionIdはROOM_NOT_FOUNDを返す', async () => {
      const manager = new InMemoryRoomManager();
      const unknownSession = SessionId('00000000-0000-4000-a000-000000000099')._unsafeUnwrap();

      const result = manager.getRoomBySessionId(unknownSession);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('ROOM_NOT_FOUND');
    });
  });

  describe('handleUserDisconnect', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('partnerDisconnectedをbroadcastしてcloseRoomを呼ぶ', async () => {
      const broadcast = vi.fn();
      const messageService = createMockMessageService();
      const manager = new InMemoryRoomManager(messageService, broadcast);

      const roomId = (await manager.createRoom(user1, user2))._unsafeUnwrap();
      broadcast.mockClear();

      const result = await manager.handleUserDisconnect(user1, roomId);

      expect(result.isOk()).toBe(true);
      // partnerDisconnected が先に発火
      const calls = broadcast.mock.calls;
      const partnerDisconnectedIdx = calls.findIndex(([, event]) => event === 'partnerDisconnected');
      const roomClosedIdx = calls.findIndex(([, event]) => event === 'roomClosed');
      expect(partnerDisconnectedIdx).toBeGreaterThanOrEqual(0);
      expect(roomClosedIdx).toBeGreaterThanOrEqual(0);
      expect(partnerDisconnectedIdx).toBeLessThan(roomClosedIdx);

      expect(broadcast).toHaveBeenCalledWith(roomId as string, 'partnerDisconnected', {
        roomId: roomId as string,
      });
      expect(broadcast).toHaveBeenCalledWith(roomId as string, 'roomClosed', {
        roomId: roomId as string,
        reason: 'user_left',
      });
    });

    it('メッセージが削除される', async () => {
      const messageService = createMockMessageService();
      const manager = new InMemoryRoomManager(messageService);

      const roomId = (await manager.createRoom(user1, user2))._unsafeUnwrap();
      await manager.handleUserDisconnect(user1, roomId);

      expect(messageService.deleteAllMessages).toHaveBeenCalledWith(roomId);
    });
  });
});
