import { describe, expect, it } from 'vitest';
import { SessionId } from '../../domain/types/valueObjects';
import { InMemoryMatchingQueue } from '../../infrastructure/matchingQueue';
import { createDequeueUser } from './dequeueUser';
import { createEnqueueUser } from './enqueueUser';

const sessionId1 = SessionId('00000000-0000-4000-a000-000000000001')._unsafeUnwrap();

describe('createDequeueUser', () => {
  it('ユーザーをキューから削除できる', async () => {
    const queue = new InMemoryMatchingQueue();
    const enqueueUser = createEnqueueUser(queue);
    const dequeueUser = createDequeueUser(queue);

    await enqueueUser(sessionId1);
    const result = await dequeueUser(sessionId1);
    expect(result.isOk()).toBe(true);
  });

  it('存在しないユーザーの削除はQUEUE_ERRORを返す', async () => {
    const dequeueUser = createDequeueUser(new InMemoryMatchingQueue());
    const result = await dequeueUser(sessionId1);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('QUEUE_ERROR');
  });
});
