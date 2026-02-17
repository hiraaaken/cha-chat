import { beforeEach, describe, expect, it } from 'vitest';
import type { StoreMessage } from './messageStore.svelte';
import { addMessage, clearMessages, messageStore, removeMessage } from './messageStore.svelte';

const createTestMessage = (overrides: Partial<StoreMessage> = {}): StoreMessage => ({
  messageId: 'msg-1',
  senderSessionId: 'session-1',
  text: 'Hello',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('messageStore', () => {
  beforeEach(() => {
    clearMessages();
  });

  it('初期状態が空配列', () => {
    expect(messageStore.messages).toEqual([]);
  });

  describe('addMessage', () => {
    it('メッセージを追加する', () => {
      const msg = createTestMessage();
      addMessage(msg);

      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0]).toEqual(msg);
    });

    it('複数メッセージを順序通り追加する', () => {
      const msg1 = createTestMessage({ messageId: 'msg-1' });
      const msg2 = createTestMessage({ messageId: 'msg-2', text: 'World' });

      addMessage(msg1);
      addMessage(msg2);

      expect(messageStore.messages).toHaveLength(2);
      expect(messageStore.messages[0].messageId).toBe('msg-1');
      expect(messageStore.messages[1].messageId).toBe('msg-2');
    });
  });

  describe('removeMessage', () => {
    it('指定IDのメッセージを削除する', () => {
      const msg1 = createTestMessage({ messageId: 'msg-1' });
      const msg2 = createTestMessage({ messageId: 'msg-2' });

      addMessage(msg1);
      addMessage(msg2);
      removeMessage('msg-1');

      expect(messageStore.messages).toHaveLength(1);
      expect(messageStore.messages[0].messageId).toBe('msg-2');
    });

    it('存在しないIDを指定しても安全', () => {
      const msg = createTestMessage();
      addMessage(msg);
      removeMessage('nonexistent');

      expect(messageStore.messages).toHaveLength(1);
    });
  });

  describe('clearMessages', () => {
    it('全メッセージを削除する', () => {
      addMessage(createTestMessage({ messageId: 'msg-1' }));
      addMessage(createTestMessage({ messageId: 'msg-2' }));

      clearMessages();

      expect(messageStore.messages).toEqual([]);
    });
  });
});
