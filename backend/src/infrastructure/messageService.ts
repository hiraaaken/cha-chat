import crypto from 'node:crypto';
import { type Result, ok } from 'neverthrow';
import type {
  MessageServiceInterface,
  SendMessageResult,
} from '../application/interfaces/messageServiceInterface';
import { type Message, createMessage } from '../domain/entities/message';
import type { MessageError } from '../domain/types/errors';
import {
  type MessageId,
  type MessageText,
  type RoomId,
  type SessionId,
  MessageId as toMessageId,
} from '../domain/types/valueObjects';

const MAX_MESSAGES_PER_USER = 3;

export class InMemoryMessageService implements MessageServiceInterface {
  private readonly rooms: Map<string, Message[]> = new Map();

  async sendMessage(
    sessionId: SessionId,
    roomId: RoomId,
    text: MessageText
  ): Promise<Result<SendMessageResult, MessageError>> {
    const messageId = toMessageId(crypto.randomUUID())._unsafeUnwrap();
    const message = createMessage(messageId, roomId, sessionId, text, new Date());

    const current = this.rooms.get(roomId as string) ?? [];
    const updated = [...current, message];
    this.rooms.set(roomId as string, updated);

    const deletedMessageId = this.pruneUserMessages(roomId, sessionId);

    return ok({ message, deletedMessageId });
  }

  async deleteAllMessages(roomId: RoomId): Promise<Result<void, MessageError>> {
    this.rooms.delete(roomId as string);
    return ok(undefined);
  }

  async getMessages(roomId: RoomId): Promise<Result<Message[], MessageError>> {
    return ok(this.rooms.get(roomId as string) ?? []);
  }

  /**
   * 指定ユーザーの送信メッセージが MAX_MESSAGES_PER_USER を超えていれば
   * 最古のものを削除し、削除した MessageId を返す
   */
  private pruneUserMessages(roomId: RoomId, sessionId: SessionId): MessageId | null {
    const messages = this.rooms.get(roomId as string) ?? [];
    const userMessages = messages.filter((m) => m.senderSessionId === sessionId);

    if (userMessages.length <= MAX_MESSAGES_PER_USER) {
      return null;
    }

    const oldest = userMessages[0];
    const pruned = messages.filter((m) => m.id !== oldest.id);
    this.rooms.set(roomId as string, pruned);
    return oldest.id;
  }
}
