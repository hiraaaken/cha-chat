import { describe, expect, it } from 'vitest';
import { SessionId } from '../domain/types/valueObjects';
import { InMemoryRoomManager } from './roomManager';

const user1 = SessionId('00000000-0000-4000-a000-000000000001')._unsafeUnwrap();
const user2 = SessionId('00000000-0000-4000-a000-000000000002')._unsafeUnwrap();

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
  });

  describe('getRoom', () => {
    it('存在しないRoomIdはROOM_NOT_FOUNDを返す', async () => {
      const manager = new InMemoryRoomManager();
      const { RoomId } = await import('../domain/types/valueObjects');
      const unknownRoomId = RoomId('00000000-0000-4000-a000-000000000099')._unsafeUnwrap();
      const result = manager.getRoom(unknownRoomId);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('ROOM_NOT_FOUND');
    });
  });
});
