import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetChatStore, chatStore, activate } from '../lib/stores/chatStore.svelte';
import { resetConnectionStore, setConnected } from '../lib/stores/connectionStore.svelte';
import { clearMessages, addMessage } from '../lib/stores/messageStore.svelte';
import ChatScreen from './ChatScreen.svelte';

vi.mock('../lib/websocket', () => ({
  sendMessage: vi.fn(),
  leaveRoom: vi.fn(),
  reportContent: vi.fn(),
}));

import { sendMessage, leaveRoom } from '../lib/websocket';

const MY_SESSION_ID = 'my-session-id';
const ROOM_ID = 'room-123';

describe('ChatScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChatStore();
    resetConnectionStore();
    clearMessages();
    setConnected(MY_SESSION_ID);
    activate(ROOM_ID);
  });

  afterEach(() => {
    cleanup();
  });

  describe('残り時間', () => {
    it('残り時間を MM:SS 形式で表示する', () => {
      chatStore.remainingSeconds = 125;
      render(ChatScreen);

      expect(screen.getByText('02:05')).toBeInTheDocument();
    });

    it('残り時間が 0 秒のとき 00:00 を表示する', () => {
      chatStore.remainingSeconds = 0;
      render(ChatScreen);

      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('残り60秒未満で警告スタイルが適用される', () => {
      chatStore.remainingSeconds = 59;
      render(ChatScreen);

      const timer = screen.getByText('00:59');
      expect(timer.classList.contains('timer-warning')).toBe(true);
    });

    it('残り60秒以上では警告スタイルが適用されない', () => {
      chatStore.remainingSeconds = 60;
      render(ChatScreen);

      const timer = screen.getByText('01:00');
      expect(timer.classList.contains('timer-warning')).toBe(false);
    });
  });

  describe('メッセージ一覧', () => {
    it('メッセージテキストを表示する', () => {
      addMessage({ messageId: 'msg-1', senderSessionId: 'other-session', text: 'こんにちは', createdAt: '2024-01-01T00:00:00Z' });
      render(ChatScreen);

      expect(screen.getByText('こんにちは')).toBeInTheDocument();
    });

    it('メッセージがないとき一覧は空', () => {
      render(ChatScreen);

      expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    });
  });

  describe('メッセージ送信', () => {
    it('入力フィールドと送信ボタンを表示する', () => {
      render(ChatScreen);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /送信/ })).toBeInTheDocument();
    });

    it('テキストを入力して送信するとsendMessageが呼ばれる', async () => {
      render(ChatScreen);

      await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'テストメッセージ' } });
      await fireEvent.click(screen.getByRole('button', { name: /送信/ }));

      expect(sendMessage).toHaveBeenCalledWith(ROOM_ID, 'テストメッセージ');
    });

    it('送信後に入力フィールドがクリアされる', async () => {
      render(ChatScreen);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await fireEvent.input(input, { target: { value: 'テスト' } });
      await fireEvent.click(screen.getByRole('button', { name: /送信/ }));

      expect(input.value).toBe('');
    });

    it('空テキストでは送信しない', async () => {
      render(ChatScreen);

      await fireEvent.click(screen.getByRole('button', { name: /送信/ }));

      expect(sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('退出', () => {
    it('退出ボタンを表示する', () => {
      render(ChatScreen);

      expect(screen.getByRole('button', { name: /退出/ })).toBeInTheDocument();
    });

    it('退出ボタンクリックでleaveRoomが呼ばれる', async () => {
      render(ChatScreen);

      await fireEvent.click(screen.getByRole('button', { name: /退出/ }));

      expect(leaveRoom).toHaveBeenCalledWith(ROOM_ID);
    });
  });
});
