import { beforeEach, describe, expect, it } from 'vitest';
import { connectionStore } from './connectionStore.svelte';

describe('connectionStore', () => {
  beforeEach(() => {
    connectionStore.reset();
  });

  it('初期状態が正しい', () => {
    expect(connectionStore.status).toBe('disconnected');
    expect(connectionStore.sessionId).toBeNull();
    expect(connectionStore.error).toBeNull();
  });

  describe('setConnecting', () => {
    it('connecting状態に遷移し、エラーをクリアする', () => {
      connectionStore.setError('previous error');
      connectionStore.setConnecting();

      expect(connectionStore.status).toBe('connecting');
      expect(connectionStore.error).toBeNull();
    });
  });

  describe('setConnected', () => {
    it('connected状態に遷移し、sessionIdが設定される', () => {
      connectionStore.setConnecting();
      connectionStore.setConnected('session-abc');

      expect(connectionStore.status).toBe('connected');
      expect(connectionStore.sessionId).toBe('session-abc');
      expect(connectionStore.error).toBeNull();
    });
  });

  describe('setDisconnected', () => {
    it('disconnected状態に遷移し、sessionIdがクリアされる', () => {
      connectionStore.setConnected('session-abc');
      connectionStore.setDisconnected();

      expect(connectionStore.status).toBe('disconnected');
      expect(connectionStore.sessionId).toBeNull();
    });
  });

  describe('setError', () => {
    it('エラーメッセージを設定する', () => {
      connectionStore.setError('Connection failed');

      expect(connectionStore.error).toBe('Connection failed');
    });
  });

  describe('reset', () => {
    it('全状態を初期値に戻す', () => {
      connectionStore.setConnected('session-abc');
      connectionStore.setError('some error');

      connectionStore.reset();

      expect(connectionStore.status).toBe('disconnected');
      expect(connectionStore.sessionId).toBeNull();
      expect(connectionStore.error).toBeNull();
    });
  });
});
