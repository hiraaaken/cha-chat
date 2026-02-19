import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chatStore, close, resetChatStore } from '../lib/stores/chatStore.svelte';
import { clearMessages } from '../lib/stores/messageStore.svelte';
import { matchingStore, resetMatchingStore } from '../lib/stores/matchingStore.svelte';
import ChatEndScreen from './ChatEndScreen.svelte';

vi.mock('../lib/websocket', () => ({
  connect: vi.fn(),
  requestMatch: vi.fn(),
}));

describe('ChatEndScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChatStore();
    resetMatchingStore();
    clearMessages();
    close('timeout');
  });

  afterEach(() => {
    cleanup();
  });

  describe('終了メッセージ', () => {
    it('チャット終了メッセージを表示する', () => {
      render(ChatEndScreen);

      expect(screen.getByRole('heading', { name: /チャットが終了しました/ })).toBeInTheDocument();
    });
  });

  describe('終了理由', () => {
    it('timeout のとき時間切れメッセージを表示する', () => {
      chatStore.closeReason = 'timeout';
      render(ChatEndScreen);

      expect(screen.getByText(/時間切れ/)).toBeInTheDocument();
    });

    it('user_left のとき相手退出メッセージを表示する', () => {
      chatStore.closeReason = 'user_left';
      render(ChatEndScreen);

      expect(screen.getByText(/相手が退出/)).toBeInTheDocument();
    });

    it('reported のとき報告メッセージを表示する', () => {
      chatStore.closeReason = 'reported';
      render(ChatEndScreen);

      expect(screen.getByText(/報告/)).toBeInTheDocument();
    });
  });

  describe('新しいマッチング', () => {
    it('新しいマッチングボタンを表示する', () => {
      render(ChatEndScreen);

      expect(screen.getByRole('button', { name: /新しいマッチング/ })).toBeInTheDocument();
    });

    it('ボタンクリックでマッチング状態をリセットしてマッチング待機画面に戻る', async () => {
      render(ChatEndScreen);

      await fireEvent.click(screen.getByRole('button', { name: /新しいマッチング/ }));

      expect(chatStore.roomStatus).toBe('idle');
      expect(matchingStore.status).toBe('idle');
    });
  });
});
