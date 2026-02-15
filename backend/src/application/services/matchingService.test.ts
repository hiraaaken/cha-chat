import { type Result, err, ok } from 'neverthrow';
import { describe, expect, it } from 'vitest';
import { type RoomError, RoomError as RoomErrorClass } from '../../domain/types/errors';
import { type RoomId, type SessionId, SessionId as toSessionId } from '../../domain/types/valueObjects';
import { InMemoryMatchingQueue } from '../../infrastructure/matchingQueue';
import type { RoomManagerInterface } from '../interfaces/roomManagerInterface';
import { MatchingService } from './matchingService';

const sessionId1 = toSessionId('00000000-0000-4000-a000-000000000001')._unsafeUnwrap();
const sessionId2 = toSessionId('00000000-0000-4000-a000-000000000002')._unsafeUnwrap();
const sessionId3 = toSessionId('00000000-0000-4000-a000-000000000003')._unsafeUnwrap();
const testRoomId = '11111111-1111-4111-a111-111111111111' as RoomId;

function createMockRoomManager(
  result: Result<RoomId, RoomError> = ok(testRoomId),
): RoomManagerInterface {
  return {
    createRoom: async () => result,
  };
}

function createService(roomManager?: RoomManagerInterface) {
  const queue = new InMemoryMatchingQueue();
  const service = new MatchingService(queue, roomManager ?? createMockRoomManager());
  return { queue, service };
}

describe('MatchingService', () => {
  describe('enqueueUser', () => {
    it('ユーザーをキューに追加できる', async () => {
      const { service } = createService();
      const result = await service.enqueueUser(sessionId1);
      expect(result.isOk()).toBe(true);
    });

    it('同じユーザーを重複追加するとALREADY_IN_QUEUEを返す', async () => {
      const { service } = createService();
      await service.enqueueUser(sessionId1);
      const result = await service.enqueueUser(sessionId1);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('ALREADY_IN_QUEUE');
    });
  });

  describe('dequeueUser', () => {
    it('ユーザーをキューから削除できる', async () => {
      const { service } = createService();
      await service.enqueueUser(sessionId1);
      const result = await service.dequeueUser(sessionId1);
      expect(result.isOk()).toBe(true);
    });

    it('存在しないユーザーの削除はQUEUE_ERRORを返す', async () => {
      const { service } = createService();
      const result = await service.dequeueUser(sessionId1);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('QUEUE_ERROR');
    });
  });

  describe('tryMatch', () => {
    it('キューが空の場合はnullを返す', async () => {
      const { service } = createService();
      const result = await service.tryMatch();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeNull();
    });

    it('キューに1人しかいない場合はnullを返す', async () => {
      const { service } = createService();
      await service.enqueueUser(sessionId1);
      const result = await service.tryMatch();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeNull();
    });

    it('キューに2人いる場合はMatchResultを返す', async () => {
      const { service } = createService();
      await service.enqueueUser(sessionId1);
      await service.enqueueUser(sessionId2);
      const result = await service.tryMatch();

      expect(result.isOk()).toBe(true);
      const matchResult = result._unsafeUnwrap();
      expect(matchResult).not.toBeNull();
      expect(matchResult?.roomId).toBe(testRoomId);
      expect(matchResult?.user1SessionId).toBe(sessionId1);
      expect(matchResult?.user2SessionId).toBe(sessionId2);
    });

    it('ルーム作成失敗時はROOM_CREATION_FAILEDを返しユーザーをキューに戻す', async () => {
      const failingRoomManager = createMockRoomManager(
        err(new RoomErrorClass('ROOM_DATABASE_ERROR', 'DB障害')),
      );
      const { service, queue } = createService(failingRoomManager);
      await service.enqueueUser(sessionId1);
      await service.enqueueUser(sessionId2);

      const result = await service.tryMatch();

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe('ROOM_CREATION_FAILED');

      // ユーザーがキューに戻されていることを確認
      const includes1 = await queue.includes(sessionId1);
      const includes2 = await queue.includes(sessionId2);
      expect(includes1._unsafeUnwrap()).toBe(true);
      expect(includes2._unsafeUnwrap()).toBe(true);
    });

    it('3人以上のキューで先頭2人がマッチされる', async () => {
      const { service } = createService();
      await service.enqueueUser(sessionId1);
      await service.enqueueUser(sessionId2);
      await service.enqueueUser(sessionId3);

      const result = await service.tryMatch();

      expect(result.isOk()).toBe(true);
      const matchResult = result._unsafeUnwrap();
      expect(matchResult?.user1SessionId).toBe(sessionId1);
      expect(matchResult?.user2SessionId).toBe(sessionId2);

      // 3人目はまだキューにいるのでnullが返る（1人しかいない）
      const secondResult = await service.tryMatch();
      expect(secondResult.isOk()).toBe(true);
      expect(secondResult._unsafeUnwrap()).toBeNull();
    });
  });
});
