import type { MessageId, MessageText, RoomId, SessionId } from '../types/valueObjects';

export type DomainEvent =
  | MatchFoundEvent
  | MessageSentEvent
  | MessageDeletedEvent
  | RoomClosedEvent
  | PartnerDisconnectedEvent;

export interface MatchFoundEvent {
  type: 'MatchFound';
  roomId: RoomId;
  user1SessionId: SessionId;
  user2SessionId: SessionId;
  occurredAt: Date;
}

export interface MessageSentEvent {
  type: 'MessageSent';
  messageId: MessageId;
  roomId: RoomId;
  senderSessionId: SessionId;
  text: MessageText;
  occurredAt: Date;
}

export interface MessageDeletedEvent {
  type: 'MessageDeleted';
  messageId: MessageId;
  roomId: RoomId;
  occurredAt: Date;
}

export interface RoomClosedEvent {
  type: 'RoomClosed';
  roomId: RoomId;
  reason: 'timeout' | 'user_left' | 'reported';
  occurredAt: Date;
}

export interface PartnerDisconnectedEvent {
  type: 'PartnerDisconnected';
  roomId: RoomId;
  disconnectedSessionId: SessionId;
  occurredAt: Date;
}
