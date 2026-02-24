import { beforeEach, describe, expect, it } from 'vitest';
import {
  connectionStore,
  resetConnectionStore,
  setConnected,
  setConnecting,
  setDisconnected,
  setError,
} from './connectionStore.svelte';

describe('connectionStore', () => {
  beforeEach(() => {
    resetConnectionStore();
  });

  it('初期状態が正しい', () => {
    expect(connectionStore.status).toBe('disconnected');
    expect(connectionStore.sessionId).toBeNull();
    expect(connectionStore.error).toBeNull();
  });

  describe('setConnecting', () => {
    it('connecting状態に遷移し、エラーをクリアする', () => {
      setError('previous error');
      setConnecting();

      expect(connectionStore.status).toBe('connecting');
      expect(connectionStore.error).toBeNull();
    });
  });

  describe('setConnected', () => {
    it('connected状態に遷移し、sessionIdが設定される', () => {
      setConnecting();
      setConnected('session-abc');

      expect(connectionStore.status).toBe('connected');
      expect(connectionStore.sessionId).toBe('session-abc');
      expect(connectionStore.error).toBeNull();
    });
  });

  describe('setDisconnected', () => {
    it('disconnected状態に遷移し、sessionIdは保持される', () => {
      setConnected('session-abc');
      setDisconnected();

      expect(connectionStore.status).toBe('disconnected');
      expect(connectionStore.sessionId).toBe('session-abc');
    });
  });

  describe('setError', () => {
    it('エラーメッセージを設定する', () => {
      setError('Connection failed');

      expect(connectionStore.error).toBe('Connection failed');
    });
  });

  describe('resetConnectionStore', () => {
    it('全状態を初期値に戻す', () => {
      setConnected('session-abc');
      setError('some error');

      resetConnectionStore();

      expect(connectionStore.status).toBe('disconnected');
      expect(connectionStore.sessionId).toBeNull();
      expect(connectionStore.error).toBeNull();
    });
  });
});
