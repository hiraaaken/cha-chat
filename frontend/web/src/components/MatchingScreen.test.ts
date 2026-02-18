import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetConnectionStore, setConnected, setError } from '../lib/stores/connectionStore.svelte';
import { matchingStore, resetMatchingStore, startWaiting } from '../lib/stores/matchingStore.svelte';
import MatchingScreen from './MatchingScreen.svelte';

vi.mock('../lib/websocket', () => ({
  connect: vi.fn(),
  requestMatch: vi.fn(),
}));

import { connect, requestMatch } from '../lib/websocket';

describe('MatchingScreen', () => {
  beforeEach(() => {
    resetMatchingStore();
    resetConnectionStore();
  });

  afterEach(() => {
    cleanup();
  });

  describe('idle 状態', () => {
    it('マッチング開始ボタンを表示する', () => {
      render(MatchingScreen);

      expect(screen.getByRole('button', { name: /マッチング開始/ })).toBeInTheDocument();
    });

    it('待機中インジケーターを表示しない', () => {
      render(MatchingScreen);

      expect(screen.queryByText(/相手を探しています/)).not.toBeInTheDocument();
    });
  });

  describe('マッチング開始ボタンクリック', () => {
    it('connect と requestMatch を呼び出す', async () => {
      render(MatchingScreen);

      await fireEvent.click(screen.getByRole('button', { name: /マッチング開始/ }));

      expect(connect).toHaveBeenCalledOnce();
      expect(requestMatch).toHaveBeenCalledOnce();
    });
  });

  describe('waiting 状態', () => {
    it('待機中メッセージを表示する', () => {
      startWaiting();
      render(MatchingScreen);

      expect(screen.getByText(/相手を探しています/)).toBeInTheDocument();
    });

    it('マッチング開始ボタンを表示しない', () => {
      startWaiting();
      render(MatchingScreen);

      expect(screen.queryByRole('button', { name: /マッチング開始/ })).not.toBeInTheDocument();
    });
  });

  describe('エラー表示', () => {
    it('エラーメッセージを表示する', () => {
      setConnected('session-1');
      setError('接続に失敗しました');
      render(MatchingScreen);

      expect(screen.getByText(/接続に失敗しました/)).toBeInTheDocument();
    });
  });
});
