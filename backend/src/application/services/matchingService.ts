import { type Result, err, ok } from 'neverthrow';
import { MatchingError } from '../../domain/types/errors';
import type { SessionId } from '../../domain/types/valueObjects';
import type { MatchingQueueInterface } from '../interfaces/matchingQueueInterface';
import type { MatchResult, MatchingServiceInterface } from '../interfaces/matchingServiceInterface';
import type { RoomManagerInterface } from '../interfaces/roomManagerInterface';

export class MatchingService implements MatchingServiceInterface {
  constructor(
    private readonly queue: MatchingQueueInterface,
    private readonly roomManager: RoomManagerInterface
  ) {}

  async enqueueUser(sessionId: SessionId): Promise<Result<void, MatchingError>> {
    return this.queue.enqueue(sessionId);
  }

  async dequeueUser(sessionId: SessionId): Promise<Result<void, MatchingError>> {
    return this.queue.dequeue(sessionId);
  }

  async tryMatch(): Promise<Result<MatchResult | null, MatchingError>> {
    const pairResult = await this.queue.tryPopPair();
    if (pairResult.isErr()) {
      return err(pairResult.error);
    }

    const pair = pairResult.value;
    if (pair === null) {
      return ok(null);
    }

    const [user1SessionId, user2SessionId] = pair;
    const roomResult = await this.roomManager.createRoom(user1SessionId, user2SessionId);

    if (roomResult.isErr()) {
      await this.queue.enqueue(user1SessionId);
      await this.queue.enqueue(user2SessionId);
      return err(new MatchingError('ROOM_CREATION_FAILED', 'ルームの作成に失敗しました'));
    }

    return ok({
      roomId: roomResult.value,
      user1SessionId,
      user2SessionId,
    });
  }
}
