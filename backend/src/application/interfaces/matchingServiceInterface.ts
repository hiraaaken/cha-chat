import type { MatchingError } from '../../domain/types/errors';
import type { RoomId, SessionId } from '../../domain/types/valueObjects';
import type { Workflow } from '../types/workflow';

export interface MatchResult {
  readonly roomId: RoomId;
  readonly user1SessionId: SessionId;
  readonly user2SessionId: SessionId;
}

export type EnqueueUser = Workflow<SessionId, void, MatchingError>;
export type DequeueUser = Workflow<SessionId, void, MatchingError>;
export type TryMatch = Workflow<void, MatchResult | null, MatchingError>;
