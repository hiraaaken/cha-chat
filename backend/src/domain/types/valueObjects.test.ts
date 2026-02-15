import { describe, expect, it } from 'vitest';
import { MessageId, MessageText, ReportReason, RoomId, SessionId, SocketId } from './valueObjects';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const INVALID_UUID = 'not-a-uuid';

describe('RoomId', () => {
  it('有効なUUID v4を受け付ける', () => {
    const result = RoomId(VALID_UUID);
    expect(result.isOk()).toBe(true);
  });

  it('無効な文字列を拒否する', () => {
    const result = RoomId(INVALID_UUID);
    expect(result.isErr()).toBe(true);
  });
});

describe('SessionId', () => {
  it('有効なUUID v4を受け付ける', () => {
    const result = SessionId(VALID_UUID);
    expect(result.isOk()).toBe(true);
  });

  it('無効な文字列を拒否する', () => {
    const result = SessionId(INVALID_UUID);
    expect(result.isErr()).toBe(true);
  });
});

describe('MessageId', () => {
  it('有効なUUID v4を受け付ける', () => {
    const result = MessageId(VALID_UUID);
    expect(result.isOk()).toBe(true);
  });

  it('無効な文字列を拒否する', () => {
    const result = MessageId(INVALID_UUID);
    expect(result.isErr()).toBe(true);
  });
});

describe('MessageText', () => {
  it('有効なテキストを受け付ける', () => {
    const result = MessageText('こんにちは');
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe('こんにちは');
  });

  it('空文字を拒否する', () => {
    const result = MessageText('');
    expect(result.isErr()).toBe(true);
  });

  it('空白のみを拒否する', () => {
    const result = MessageText('   ');
    expect(result.isErr()).toBe(true);
  });

  it('500文字を超えるテキストを拒否する', () => {
    const result = MessageText('a'.repeat(501));
    expect(result.isErr()).toBe(true);
  });

  it('500文字ちょうどは受け付ける', () => {
    const result = MessageText('a'.repeat(500));
    expect(result.isOk()).toBe(true);
  });

  it('HTMLタグを除去する', () => {
    const result = MessageText('<script>alert("xss")</script>hello');
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe('alert("xss")hello');
  });
});

describe('ReportReason', () => {
  it.each(['spam', 'harassment', 'inappropriate_content', 'other'])('%s を受け付ける', (reason) => {
    const result = ReportReason(reason);
    expect(result.isOk()).toBe(true);
  });

  it('無効な理由を拒否する', () => {
    const result = ReportReason('invalid');
    expect(result.isErr()).toBe(true);
  });
});

describe('SocketId', () => {
  it('有効な文字列を受け付ける', () => {
    const result = SocketId('abc123');
    expect(result.isOk()).toBe(true);
  });

  it('空文字を拒否する', () => {
    const result = SocketId('');
    expect(result.isErr()).toBe(true);
  });
});
