import { type MockInstance, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MatchingError, RoomError } from '../domain/types/errors';
import { handleError, retryWithBackoff } from './errorHandler';

describe('handleError', () => {
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('ソケットに error イベントを emit する', () => {
    const socket = { emit: vi.fn() };
    const error = new MatchingError('QUEUE_ERROR', 'キュー操作に失敗しました');

    handleError(socket as never, error, 'trace-123');

    expect(socket.emit).toHaveBeenCalledWith('error', {
      code: 'QUEUE_ERROR',
      message: 'エラーが発生しました。しばらくしてからお試しください。',
      retryable: true,
    });
  });

  it('FATAL エラーの場合 retryable: false で emit する', () => {
    const socket = { emit: vi.fn() };
    const error = new RoomError('ROOM_DATABASE_ERROR', 'DB接続エラー');

    handleError(socket as never, error, 'trace-456');

    expect(socket.emit).toHaveBeenCalledWith('error', {
      code: 'ROOM_DATABASE_ERROR',
      message: 'システムエラーが発生しました。',
      retryable: false,
    });
  });

  it('構造化ログを出力する', () => {
    const socket = { emit: vi.fn() };
    const error = new MatchingError('QUEUE_ERROR', 'キュー操作に失敗しました');

    handleError(socket as never, error, 'trace-789');

    expect(consoleErrorSpy).toHaveBeenCalledOnce();
    const logArg = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
    expect(logArg).toMatchObject({
      level: 'error',
      category: 'TRANSIENT',
      code: 'QUEUE_ERROR',
      message: 'キュー操作に失敗しました',
      traceId: 'trace-789',
    });
    expect(logArg.timestamp).toBeDefined();
  });
});

describe('retryWithBackoff', () => {
  it('成功時に即座に結果を返す', async () => {
    const operation = vi.fn().mockResolvedValue('success');

    const result = await retryWithBackoff(operation, 3, 0);

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledOnce();
  });

  it('失敗後にリトライして成功する', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const result = await retryWithBackoff(operation, 3, 0);

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('最大リトライ回数を超えたらエラーをスローする', async () => {
    const error = new Error('persistent failure');
    const operation = vi.fn().mockRejectedValue(error);

    await expect(retryWithBackoff(operation, 2, 0)).rejects.toThrow('persistent failure');
    expect(operation).toHaveBeenCalledTimes(3); // 初回 + 2リトライ
  });

  it('デフォルトの baseDelay は 1000ms', async () => {
    const start = Date.now();
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    await retryWithBackoff(operation, 1);

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(900); // 1000ms ± tolerance
    expect(operation).toHaveBeenCalledTimes(2);
  });
});
