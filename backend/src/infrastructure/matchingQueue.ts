import { type Result, err, ok } from 'neverthrow';
import type { MatchingQueueInterface } from '../application/interfaces/matchingQueueInterface';
import { MatchingError } from '../domain/types/errors';
import type { SessionId } from '../domain/types/valueObjects';

export class InMemoryMatchingQueue implements MatchingQueueInterface {
  private readonly queue: SessionId[] = [];

  async enqueue(sessionId: SessionId): Promise<Result<void, MatchingError>> {
    if (this.queue.includes(sessionId)) {
      return err(new MatchingError('ALREADY_IN_QUEUE', '既にマッチング待機中です'));
    }
    this.queue.push(sessionId);
    return ok(undefined);
  }

  async dequeue(sessionId: SessionId): Promise<Result<void, MatchingError>> {
    const index = this.queue.indexOf(sessionId);
    if (index === -1) {
      return err(new MatchingError('QUEUE_ERROR', 'キューにユーザーが見つかりません'));
    }
    this.queue.splice(index, 1);
    return ok(undefined);
  }

  async tryPopPair(): Promise<Result<[SessionId, SessionId] | null, MatchingError>> {
    if (this.queue.length < 2) {
      return ok(null);
    }
    const user1 = this.queue.shift() as SessionId;
    const user2 = this.queue.shift() as SessionId;
    return ok([user1, user2]);
  }

  async includes(sessionId: SessionId): Promise<Result<boolean, MatchingError>> {
    return ok(this.queue.includes(sessionId));
  }
}
