import { beforeEach, describe, expect, it } from 'vitest';
import { chatStore } from './chatStore.svelte';

describe('chatStore', () => {
  beforeEach(() => {
    chatStore.reset();
  });

  it('初期状態が正しい', () => {
    expect(chatStore.roomStatus).toBe('idle');
    expect(chatStore.roomId).toBeNull();
    expect(chatStore.remainingSeconds).toBe(0);
    expect(chatStore.closeReason).toBeNull();
  });

  describe('activate', () => {
    it('idle → active に遷移し、roomIdが設定される', () => {
      chatStore.activate('room-123');

      expect(chatStore.roomStatus).toBe('active');
      expect(chatStore.roomId).toBe('room-123');
      expect(chatStore.closeReason).toBeNull();
    });
  });

  describe('updateRemainingSeconds', () => {
    it('残り時間を更新する', () => {
      chatStore.updateRemainingSeconds(300);

      expect(chatStore.remainingSeconds).toBe(300);
    });
  });

  describe('close', () => {
    it('active → closed に遷移し、closeReasonが設定される', () => {
      chatStore.activate('room-123');
      chatStore.close('timeout');

      expect(chatStore.roomStatus).toBe('closed');
      expect(chatStore.closeReason).toBe('timeout');
    });

    it('user_left理由で終了できる', () => {
      chatStore.activate('room-123');
      chatStore.close('user_left');

      expect(chatStore.closeReason).toBe('user_left');
    });

    it('reported理由で終了できる', () => {
      chatStore.activate('room-123');
      chatStore.close('reported');

      expect(chatStore.closeReason).toBe('reported');
    });
  });

  describe('reset', () => {
    it('全状態を初期値に戻す', () => {
      chatStore.activate('room-123');
      chatStore.updateRemainingSeconds(300);
      chatStore.close('timeout');

      chatStore.reset();

      expect(chatStore.roomStatus).toBe('idle');
      expect(chatStore.roomId).toBeNull();
      expect(chatStore.remainingSeconds).toBe(0);
      expect(chatStore.closeReason).toBeNull();
    });
  });
});
