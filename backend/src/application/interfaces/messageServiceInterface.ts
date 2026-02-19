import type { Result } from 'neverthrow';
import type { Message } from '../../domain/entities/message';
import type { MessageError } from '../../domain/types/errors';
import type { MessageId, MessageText, RoomId, SessionId } from '../../domain/types/valueObjects';

export interface SendMessageResult {
  readonly message: Message;
  readonly deletedMessageId: MessageId | null;
}

export interface MessageServiceInterface {
  sendMessage(
    sessionId: SessionId,
    roomId: RoomId,
    text: MessageText
  ): Promise<Result<SendMessageResult, MessageError>>;
  deleteAllMessages(roomId: RoomId): Promise<Result<void, MessageError>>;
  getMessages(roomId: RoomId): Promise<Result<Message[], MessageError>>;
}
