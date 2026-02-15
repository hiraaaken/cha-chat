import type { MessageId, MessageText, RoomId, SessionId } from '../types/valueObjects';

export interface Message {
  id: MessageId;
  roomId: RoomId;
  senderSessionId: SessionId;
  text: MessageText;
  createdAt: Date;
}

export function createMessage(
  id: MessageId,
  roomId: RoomId,
  senderSessionId: SessionId,
  text: MessageText,
  createdAt: Date
): Message {
  return { id, roomId, senderSessionId, text, createdAt };
}
