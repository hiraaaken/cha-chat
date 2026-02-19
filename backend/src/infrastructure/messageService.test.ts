import { describe, expect, it } from 'vitest';
import { MessageText, RoomId, SessionId } from '../domain/types/valueObjects';
import { InMemoryMessageService } from './messageService';

const roomId = RoomId('00000000-0000-4000-a000-000000000001')._unsafeUnwrap();
const user1 = SessionId('00000000-0000-4000-a000-000000000010')._unsafeUnwrap();
const user2 = SessionId('00000000-0000-4000-a000-000000000020')._unsafeUnwrap();
const text = MessageText('こんにちは')._unsafeUnwrap();

describe('InMemoryMessageService', () => {
  describe('sendMessage', () => {
    it('メッセージを保存してMessageを返す', async () => {
      const service = new InMemoryMessageService();
      const result = await service.sendMessage(user1, roomId, text);

      expect(result.isOk()).toBe(true);
      const { message, deletedMessageId } = result._unsafeUnwrap();
      expect(message.senderSessionId).toBe(user1);
      expect(message.roomId).toBe(roomId);
      expect(message.text).toBe(text);
      expect(deletedMessageId).toBeNull();
    });

    it('同一ユーザーの3件以内はdeletedMessageIdがnull', async () => {
      const service = new InMemoryMessageService();

      for (let i = 0; i < 3; i++) {
        const t = MessageText(`メッセージ${i + 1}`)._unsafeUnwrap();
        const result = await service.sendMessage(user1, roomId, t);
        expect(result._unsafeUnwrap().deletedMessageId).toBeNull();
      }
    });

    it('同一ユーザーが4件目を送信すると最古のメッセージIDが削除される', async () => {
      const service = new InMemoryMessageService();

      let firstMessageId: string | null = null;
      for (let i = 0; i < 4; i++) {
        const t = MessageText(`メッセージ${i + 1}`)._unsafeUnwrap();
        const result = await service.sendMessage(user1, roomId, t);
        if (i === 0) {
          firstMessageId = result._unsafeUnwrap().message.id as string;
        }
      }

      const fourthResult = await service.sendMessage(
        user1,
        roomId,
        MessageText('5件目')._unsafeUnwrap()
      );
      // 4件目以降は常に最古を削除するので、5件目送信時に2件目が削除される
      expect(fourthResult._unsafeUnwrap().deletedMessageId).not.toBeNull();
      // firstMessageId は既に4件目送信時に削除済み
      expect(firstMessageId).not.toBeNull();
    });

    it('同一ユーザーが4件目を送信するとgetMessagesは3件を返す', async () => {
      const service = new InMemoryMessageService();

      for (let i = 0; i < 4; i++) {
        const t = MessageText(`メッセージ${i + 1}`)._unsafeUnwrap();
        await service.sendMessage(user1, roomId, t);
      }

      const messages = (await service.getMessages(roomId))._unsafeUnwrap();
      const user1Messages = messages.filter((m) => m.senderSessionId === user1);
      expect(user1Messages).toHaveLength(3);
    });

    it('別ユーザーのメッセージは削除対象にならない', async () => {
      const service = new InMemoryMessageService();

      for (let i = 0; i < 3; i++) {
        await service.sendMessage(user1, roomId, MessageText(`user1-${i + 1}`)._unsafeUnwrap());
      }
      // user2 がメッセージを送っても user1 のメッセージは削除されない
      const result = await service.sendMessage(
        user2,
        roomId,
        MessageText('user2のメッセージ')._unsafeUnwrap()
      );

      expect(result._unsafeUnwrap().deletedMessageId).toBeNull();
      const all = (await service.getMessages(roomId))._unsafeUnwrap();
      expect(all).toHaveLength(4);
    });
  });

  describe('getMessages', () => {
    it('メッセージが存在しないルームは空配列を返す', async () => {
      const service = new InMemoryMessageService();
      const result = await service.getMessages(roomId);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toHaveLength(0);
    });

    it('送信済みメッセージを送信順で返す', async () => {
      const service = new InMemoryMessageService();
      await service.sendMessage(user1, roomId, MessageText('1番目')._unsafeUnwrap());
      await service.sendMessage(user2, roomId, MessageText('2番目')._unsafeUnwrap());

      const messages = (await service.getMessages(roomId))._unsafeUnwrap();
      expect(messages).toHaveLength(2);
      expect(messages[0].text as string).toBe('1番目');
      expect(messages[1].text as string).toBe('2番目');
    });
  });

  describe('deleteAllMessages', () => {
    it('ルームの全メッセージを削除する', async () => {
      const service = new InMemoryMessageService();
      await service.sendMessage(user1, roomId, text);
      await service.sendMessage(user2, roomId, text);

      const deleteResult = await service.deleteAllMessages(roomId);
      expect(deleteResult.isOk()).toBe(true);

      const messages = (await service.getMessages(roomId))._unsafeUnwrap();
      expect(messages).toHaveLength(0);
    });

    it('メッセージが存在しないルームの削除は成功する', async () => {
      const service = new InMemoryMessageService();
      const result = await service.deleteAllMessages(roomId);
      expect(result.isOk()).toBe(true);
    });
  });
});
