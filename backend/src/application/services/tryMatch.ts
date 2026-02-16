import { err, ok } from 'neverthrow';
import { MatchingError } from '../../domain/types/errors';
import type { MatchingQueueInterface } from '../interfaces/matchingQueueInterface';
import type { TryMatch } from '../interfaces/matchingServiceInterface';
import type { RoomManagerInterface } from '../interfaces/roomManagerInterface';

export function createTryMatch(
  queue: MatchingQueueInterface,
  roomManager: RoomManagerInterface
): TryMatch {
  return async () => {
    const pairResult = await queue.tryPopPair();
    if (pairResult.isErr()) {
      return err(pairResult.error);
    }

    const pair = pairResult.value;
    if (pair === null) {
      return ok(null);
    }

    const [user1SessionId, user2SessionId] = pair;
    const roomResult = await roomManager.createRoom(user1SessionId, user2SessionId);

    if (roomResult.isErr()) {
      await queue.enqueue(user1SessionId);
      await queue.enqueue(user2SessionId);
      return err(new MatchingError('ROOM_CREATION_FAILED', 'ルームの作成に失敗しました'));
    }

    return ok({
      roomId: roomResult.value,
      user1SessionId,
      user2SessionId,
    });
  };
}
