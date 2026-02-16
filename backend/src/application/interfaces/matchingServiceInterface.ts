import type { Result } from 'neverthrow';
import type { MatchingError } from '../../domain/types/errors';
import type { RoomId, SessionId } from '../../domain/types/valueObjects';

export interface MatchResult {
  readonly roomId: RoomId;
  readonly user1SessionId: SessionId;
  readonly user2SessionId: SessionId;
}

export interface MatchingServiceInterface {
  enqueueUser(sessionId: SessionId): Promise<Result<void, MatchingError>>;
  dequeueUser(sessionId: SessionId): Promise<Result<void, MatchingError>>;
  tryMatch(): Promise<Result<MatchResult | null, MatchingError>>;
}
