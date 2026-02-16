import type { Result } from 'neverthrow';
import type { RoomError } from '../../domain/types/errors';
import type { RoomId, SessionId } from '../../domain/types/valueObjects';

export interface RoomManagerInterface {
  createRoom(
    user1SessionId: SessionId,
    user2SessionId: SessionId
  ): Promise<Result<RoomId, RoomError>>;
}
