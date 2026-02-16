import type { MatchingQueueInterface } from '../interfaces/matchingQueueInterface';
import type { EnqueueUser } from '../interfaces/matchingServiceInterface';

export function createEnqueueUser(queue: MatchingQueueInterface): EnqueueUser {
  return (sessionId) => queue.enqueue(sessionId);
}
