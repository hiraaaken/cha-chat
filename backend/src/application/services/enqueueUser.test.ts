import { describe, expect, it } from 'vitest';
import { SessionId } from '../../domain/types/valueObjects';
import { InMemoryMatchingQueue } from '../../infrastructure/matchingQueue';
import { createEnqueueUser } from './enqueueUser';

const sessionId1 = SessionId('00000000-0000-4000-a000-000000000001')._unsafeUnwrap();

describe('createEnqueueUser', () => {
  it('ユーザーをキューに追加できる', async () => {
    const enqueueUser = createEnqueueUser(new InMemoryMatchingQueue());
    const result = await enqueueUser(sessionId1);
    expect(result.isOk()).toBe(true);
  });

  it('同じユーザーを重複追加するとALREADY_IN_QUEUEを返す', async () => {
    const enqueueUser = createEnqueueUser(new InMemoryMatchingQueue());
    await enqueueUser(sessionId1);
    const result = await enqueueUser(sessionId1);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('ALREADY_IN_QUEUE');
  });
});
