import type { MatchingQueueInterface } from '../interfaces/matchingQueueInterface';
import type { DequeueUser } from '../interfaces/matchingServiceInterface';

export function createDequeueUser(queue: MatchingQueueInterface): DequeueUser {
  return (sessionId) => queue.dequeue(sessionId);
}
