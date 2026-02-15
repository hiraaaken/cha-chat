import { describe, expect, it } from 'vitest';
import {
  MatchingError,
  MessageError,
  ReportError,
  RoomError,
  SessionError,
  toErrorContext,
} from './errors';

describe('MatchingError', () => {
  it('code と message を保持する', () => {
    const error = new MatchingError('QUEUE_ERROR', 'キュー操作に失敗しました');
    expect(error.code).toBe('QUEUE_ERROR');
    expect(error.message).toBe('キュー操作に失敗しました');
    expect(error.name).toBe('MatchingError');
    expect(error).toBeInstanceOf(Error);
  });

  it.each(['QUEUE_ERROR', 'ROOM_CREATION_FAILED', 'ALREADY_IN_QUEUE'] as const)(
    'コード %s を受け付ける',
    (code) => {
      const error = new MatchingError(code, 'テスト');
      expect(error.code).toBe(code);
    }
  );
});

describe('RoomError', () => {
  it('code と message を保持する', () => {
    const error = new RoomError('ROOM_NOT_FOUND', 'ルームが見つかりません');
    expect(error.code).toBe('ROOM_NOT_FOUND');
    expect(error.message).toBe('ルームが見つかりません');
    expect(error.name).toBe('RoomError');
    expect(error).toBeInstanceOf(Error);
  });

  it.each(['ROOM_NOT_FOUND', 'ROOM_ALREADY_CLOSED', 'ROOM_DATABASE_ERROR'] as const)(
    'コード %s を受け付ける',
    (code) => {
      const error = new RoomError(code, 'テスト');
      expect(error.code).toBe(code);
    }
  );
});

describe('MessageError', () => {
  it('code と message を保持する', () => {
    const error = new MessageError('MESSAGE_ROOM_NOT_FOUND', 'ルームが見つかりません');
    expect(error.code).toBe('MESSAGE_ROOM_NOT_FOUND');
    expect(error.message).toBe('ルームが見つかりません');
    expect(error.name).toBe('MessageError');
    expect(error).toBeInstanceOf(Error);
  });

  it.each(['MESSAGE_ROOM_NOT_FOUND', 'MESSAGE_ROOM_CLOSED', 'MESSAGE_DATABASE_ERROR'] as const)(
    'コード %s を受け付ける',
    (code) => {
      const error = new MessageError(code, 'テスト');
      expect(error.code).toBe(code);
    }
  );
});

describe('SessionError', () => {
  it('code と message を保持する', () => {
    const error = new SessionError('SESSION_NOT_FOUND', 'セッションが見つかりません');
    expect(error.code).toBe('SESSION_NOT_FOUND');
    expect(error.message).toBe('セッションが見つかりません');
    expect(error.name).toBe('SessionError');
    expect(error).toBeInstanceOf(Error);
  });

  it.each(['SESSION_NOT_FOUND', 'SESSION_EXPIRED', 'SOCKET_ALREADY_BOUND'] as const)(
    'コード %s を受け付ける',
    (code) => {
      const error = new SessionError(code, 'テスト');
      expect(error.code).toBe(code);
    }
  );
});

describe('ReportError', () => {
  it('code と message を保持する', () => {
    const error = new ReportError('REPORT_ROOM_NOT_FOUND', 'ルームが見つかりません');
    expect(error.code).toBe('REPORT_ROOM_NOT_FOUND');
    expect(error.message).toBe('ルームが見つかりません');
    expect(error.name).toBe('ReportError');
    expect(error).toBeInstanceOf(Error);
  });

  it.each(['REPORT_ROOM_NOT_FOUND', 'ALREADY_REPORTED', 'REPORT_DATABASE_ERROR'] as const)(
    'コード %s を受け付ける',
    (code) => {
      const error = new ReportError(code, 'テスト');
      expect(error.code).toBe(code);
    }
  );
});

describe('toErrorContext', () => {
  it('TRANSIENT カテゴリのエラーを変換する', () => {
    const error = new MatchingError('QUEUE_ERROR', 'キュー操作に失敗しました');
    const context = toErrorContext(error, 'trace-123');

    expect(context).toStrictEqual({
      category: 'TRANSIENT',
      code: 'QUEUE_ERROR',
      message: 'キュー操作に失敗しました',
      userMessage: 'エラーが発生しました。しばらくしてからお試しください。',
      retryable: true,
      traceId: 'trace-123',
    });
  });

  it('BUSINESS_LOGIC カテゴリのエラーを変換する', () => {
    const error = new MatchingError('ALREADY_IN_QUEUE', 'すでにキューに入っています');
    const context = toErrorContext(error, 'trace-456');

    expect(context.category).toBe('BUSINESS_LOGIC');
    expect(context.retryable).toBe(false);
  });

  it('FATAL カテゴリのエラーを変換する', () => {
    const error = new RoomError('ROOM_DATABASE_ERROR', 'DB接続エラー');
    const context = toErrorContext(error, 'trace-789');

    expect(context.category).toBe('FATAL');
    expect(context.retryable).toBe(false);
  });

  it('RoomError ROOM_NOT_FOUND は BUSINESS_LOGIC', () => {
    const error = new RoomError('ROOM_NOT_FOUND', 'ルームが見つかりません');
    const context = toErrorContext(error, 'trace-001');

    expect(context.category).toBe('BUSINESS_LOGIC');
    expect(context.retryable).toBe(false);
  });

  it('RoomError ROOM_ALREADY_CLOSED は BUSINESS_LOGIC', () => {
    const error = new RoomError('ROOM_ALREADY_CLOSED', 'ルームは既に閉じています');
    const context = toErrorContext(error, 'trace-002');

    expect(context.category).toBe('BUSINESS_LOGIC');
    expect(context.retryable).toBe(false);
  });

  it('MessageError の各コードを正しく変換する', () => {
    expect(toErrorContext(new MessageError('MESSAGE_ROOM_NOT_FOUND', 'x'), 't').category).toBe(
      'BUSINESS_LOGIC'
    );
    expect(toErrorContext(new MessageError('MESSAGE_ROOM_CLOSED', 'x'), 't').category).toBe(
      'BUSINESS_LOGIC'
    );
    expect(toErrorContext(new MessageError('MESSAGE_DATABASE_ERROR', 'x'), 't').category).toBe(
      'FATAL'
    );
  });

  it('SessionError の各コードを正しく変換する', () => {
    expect(toErrorContext(new SessionError('SESSION_NOT_FOUND', 'x'), 't').category).toBe(
      'BUSINESS_LOGIC'
    );
    expect(toErrorContext(new SessionError('SESSION_EXPIRED', 'x'), 't').category).toBe(
      'BUSINESS_LOGIC'
    );
    expect(toErrorContext(new SessionError('SOCKET_ALREADY_BOUND', 'x'), 't').category).toBe(
      'BUSINESS_LOGIC'
    );
  });

  it('ReportError の各コードを正しく変換する', () => {
    expect(toErrorContext(new ReportError('REPORT_ROOM_NOT_FOUND', 'x'), 't').category).toBe(
      'BUSINESS_LOGIC'
    );
    expect(toErrorContext(new ReportError('ALREADY_REPORTED', 'x'), 't').category).toBe(
      'BUSINESS_LOGIC'
    );
    expect(toErrorContext(new ReportError('REPORT_DATABASE_ERROR', 'x'), 't').category).toBe(
      'FATAL'
    );
  });
});
