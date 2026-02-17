import { beforeEach, describe, expect, it } from 'vitest';
import { matchingStore } from './matchingStore.svelte';

describe('matchingStore', () => {
  beforeEach(() => {
    matchingStore.reset();
  });

  it('初期状態がidleである', () => {
    expect(matchingStore.status).toBe('idle');
  });

  describe('startWaiting', () => {
    it('idle → waiting に遷移する', () => {
      matchingStore.startWaiting();

      expect(matchingStore.status).toBe('waiting');
    });
  });

  describe('matched', () => {
    it('waiting → matched に遷移する', () => {
      matchingStore.startWaiting();
      matchingStore.matched();

      expect(matchingStore.status).toBe('matched');
    });
  });

  describe('reset', () => {
    it('idleに戻る', () => {
      matchingStore.startWaiting();
      matchingStore.matched();

      matchingStore.reset();

      expect(matchingStore.status).toBe('idle');
    });
  });
});
