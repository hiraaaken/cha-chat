import { beforeEach, describe, expect, it } from 'vitest';
import { matched, matchingStore, resetMatchingStore, startWaiting } from './matchingStore.svelte';

describe('matchingStore', () => {
  beforeEach(() => {
    resetMatchingStore();
  });

  it('初期状態がidleである', () => {
    expect(matchingStore.status).toBe('idle');
  });

  describe('startWaiting', () => {
    it('idle → waiting に遷移する', () => {
      startWaiting();

      expect(matchingStore.status).toBe('waiting');
    });
  });

  describe('matched', () => {
    it('waiting → matched に遷移する', () => {
      startWaiting();
      matched();

      expect(matchingStore.status).toBe('matched');
    });
  });

  describe('resetMatchingStore', () => {
    it('idleに戻る', () => {
      startWaiting();
      matched();

      resetMatchingStore();

      expect(matchingStore.status).toBe('idle');
    });
  });
});
