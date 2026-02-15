import type { Result } from 'neverthrow';
import type { MatchingError } from '../../domain/types/errors';
import type { SessionId } from '../../domain/types/valueObjects';

export interface MatchingQueueInterface {
  enqueue(sessionId: SessionId): Promise<Result<void, MatchingError>>;
  dequeue(sessionId: SessionId): Promise<Result<void, MatchingError>>;
  tryPopPair(): Promise<Result<[SessionId, SessionId] | null, MatchingError>>;
  includes(sessionId: SessionId): Promise<Result<boolean, MatchingError>>;
}
