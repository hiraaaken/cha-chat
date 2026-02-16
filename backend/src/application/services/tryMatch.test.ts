import { type Result, err, ok } from 'neverthrow';
import { describe, expect, it } from 'vitest';
import { type RoomError, RoomError as RoomErrorClass } from '../../domain/types/errors';
import { type RoomId, SessionId } from '../../domain/types/valueObjects';
import { InMemoryMatchingQueue } from '../../infrastructure/matchingQueue';
import type { RoomManagerInterface } from '../interfaces/roomManagerInterface';
import { createEnqueueUser } from './enqueueUser';
import { createTryMatch } from './tryMatch';

const sessionId1 = SessionId('00000000-0000-4000-a000-000000000001')._unsafeUnwrap();
const sessionId2 = SessionId('00000000-0000-4000-a000-000000000002')._unsafeUnwrap();
const sessionId3 = SessionId('00000000-0000-4000-a000-000000000003')._unsafeUnwrap();
const testRoomId = '11111111-1111-4111-a111-111111111111' as RoomId;

function createMockRoomManager(
  result: Result<RoomId, RoomError> = ok(testRoomId)
): RoomManagerInterface {
  return {
    createRoom: async () => result,
  };
}

function createWorkflows(roomManager?: RoomManagerInterface) {
  const queue = new InMemoryMatchingQueue();
  const rm = roomManager ?? createMockRoomManager();
  return {
    queue,
    enqueueUser: createEnqueueUser(queue),
    tryMatch: createTryMatch(queue, rm),
  };
}

describe('createTryMatch', () => {
  it('キューが空の場合はnullを返す', async () => {
    const { tryMatch } = createWorkflows();
    const result = await tryMatch();

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBeNull();
  });

  it('キューに1人しかいない場合はnullを返す', async () => {
    const { enqueueUser, tryMatch } = createWorkflows();
    await enqueueUser(sessionId1);
    const result = await tryMatch();

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBeNull();
  });

  it('キューに2人いる場合はMatchResultを返す', async () => {
    const { enqueueUser, tryMatch } = createWorkflows();
    await enqueueUser(sessionId1);
    await enqueueUser(sessionId2);
    const result = await tryMatch();

    expect(result.isOk()).toBe(true);
    const matchResult = result._unsafeUnwrap();
    expect(matchResult).not.toBeNull();
    expect(matchResult?.roomId).toBe(testRoomId);
    expect(matchResult?.user1SessionId).toBe(sessionId1);
    expect(matchResult?.user2SessionId).toBe(sessionId2);
  });

  it('ルーム作成失敗時はROOM_CREATION_FAILEDを返しユーザーをキューに戻す', async () => {
    const failingRoomManager = createMockRoomManager(
      err(new RoomErrorClass('ROOM_DATABASE_ERROR', 'DB障害'))
    );
    const { enqueueUser, tryMatch, queue } = createWorkflows(failingRoomManager);
    await enqueueUser(sessionId1);
    await enqueueUser(sessionId2);

    const result = await tryMatch();

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('ROOM_CREATION_FAILED');

    const includes1 = await queue.includes(sessionId1);
    const includes2 = await queue.includes(sessionId2);
    expect(includes1._unsafeUnwrap()).toBe(true);
    expect(includes2._unsafeUnwrap()).toBe(true);
  });

  it('3人以上のキューで先頭2人がマッチされる', async () => {
    const { enqueueUser, tryMatch } = createWorkflows();
    await enqueueUser(sessionId1);
    await enqueueUser(sessionId2);
    await enqueueUser(sessionId3);

    const result = await tryMatch();

    expect(result.isOk()).toBe(true);
    const matchResult = result._unsafeUnwrap();
    expect(matchResult?.user1SessionId).toBe(sessionId1);
    expect(matchResult?.user2SessionId).toBe(sessionId2);

    const secondResult = await tryMatch();
    expect(secondResult.isOk()).toBe(true);
    expect(secondResult._unsafeUnwrap()).toBeNull();
  });
});
