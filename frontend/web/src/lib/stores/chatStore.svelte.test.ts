import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  activate,
  chatStore,
  close,
  resetChatStore,
  selfLeave,
  startCountdown,
  stopCountdown,
  updateRemainingSeconds,
} from './chatStore.svelte';

describe('chatStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetChatStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('初期状態が正しい', () => {
    expect(chatStore.roomStatus).toBe('idle');
    expect(chatStore.roomId).toBeNull();
    expect(chatStore.remainingSeconds).toBe(0);
    expect(chatStore.closeReason).toBeNull();
  });

  describe('activate', () => {
    it('idle → active に遷移し、roomIdが設定される', () => {
      activate('room-123');

      expect(chatStore.roomStatus).toBe('active');
      expect(chatStore.roomId).toBe('room-123');
      expect(chatStore.closeReason).toBeNull();
    });

    it('remainingSecondsが600に設定される', () => {
      activate('room-123');

      expect(chatStore.remainingSeconds).toBe(600);
    });
  });

  describe('startCountdown / stopCountdown', () => {
    it('1秒ごとにremainingSecondsがデクリメントされる', () => {
      activate('room-123');
      startCountdown();

      vi.advanceTimersByTime(3000);

      expect(chatStore.remainingSeconds).toBe(597);
    });

    it('remainingSecondsが0になったらカウントダウンが停止する', () => {
      activate('room-123');
      chatStore.remainingSeconds = 2;
      startCountdown();

      vi.advanceTimersByTime(5000);

      expect(chatStore.remainingSeconds).toBe(0);
    });

    it('stopCountdownでカウントダウンが停止する', () => {
      activate('room-123');
      startCountdown();

      vi.advanceTimersByTime(2000);
      stopCountdown();
      vi.advanceTimersByTime(3000);

      expect(chatStore.remainingSeconds).toBe(598);
    });
  });

  describe('updateRemainingSeconds', () => {
    it('残り時間を更新する', () => {
      updateRemainingSeconds(300);

      expect(chatStore.remainingSeconds).toBe(300);
    });
  });

  describe('close', () => {
    it('active → closed に遷移し、closeReasonが設定される', () => {
      activate('room-123');
      close('timeout');

      expect(chatStore.roomStatus).toBe('closed');
      expect(chatStore.closeReason).toBe('timeout');
    });

    it('user_left理由で終了できる', () => {
      activate('room-123');
      close('user_left');

      expect(chatStore.closeReason).toBe('user_left');
    });

    it('reported理由で終了できる', () => {
      activate('room-123');
      close('reported');

      expect(chatStore.closeReason).toBe('reported');
    });

    it('カウントダウンを停止する', () => {
      activate('room-123');
      startCountdown();
      vi.advanceTimersByTime(1000);

      close('timeout');
      vi.advanceTimersByTime(3000);

      expect(chatStore.remainingSeconds).toBe(599);
    });
  });

  describe('selfLeave', () => {
    it('self_left理由でcloseされる', () => {
      activate('room-123');
      selfLeave();

      expect(chatStore.roomStatus).toBe('closed');
      expect(chatStore.closeReason).toBe('self_left');
    });
  });

  describe('resetChatStore', () => {
    it('全状態を初期値に戻す', () => {
      activate('room-123');
      updateRemainingSeconds(300);
      close('timeout');

      resetChatStore();

      expect(chatStore.roomStatus).toBe('idle');
      expect(chatStore.roomId).toBeNull();
      expect(chatStore.remainingSeconds).toBe(0);
      expect(chatStore.closeReason).toBeNull();
    });

    it('カウントダウンを停止する', () => {
      activate('room-123');
      startCountdown();
      vi.advanceTimersByTime(1000);

      resetChatStore();
      vi.advanceTimersByTime(3000);

      expect(chatStore.remainingSeconds).toBe(0);
    });
  });
});
