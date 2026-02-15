import { type Result, err, ok } from 'neverthrow';
import { type Newtype, ValidationError } from './base';

// --- RoomId ---
export type RoomId = Newtype<'RoomId', string>;

export function RoomId(value: string): Result<RoomId, ValidationError> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value)
    ? ok(value as RoomId)
    : err(new ValidationError('RoomIdはUUID v4形式である必要があります'));
}

// --- SessionId ---
export type SessionId = Newtype<'SessionId', string>;

export function SessionId(value: string): Result<SessionId, ValidationError> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value)
    ? ok(value as SessionId)
    : err(new ValidationError('SessionIdはUUID v4形式である必要があります'));
}

// --- MessageId ---
export type MessageId = Newtype<'MessageId', string>;

export function MessageId(value: string): Result<MessageId, ValidationError> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value)
    ? ok(value as MessageId)
    : err(new ValidationError('MessageIdはUUID v4形式である必要があります'));
}

// --- MessageText ---
export type MessageText = Newtype<'MessageText', string>;

const MAX_MESSAGE_LENGTH = 500;

export function MessageText(value: string): Result<MessageText, ValidationError> {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return err(new ValidationError('メッセージは空にできません'));
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return err(
      new ValidationError(`メッセージは${MAX_MESSAGE_LENGTH}文字以内である必要があります`)
    );
  }
  // HTMLタグ除去
  const sanitized = trimmed.replace(/<[^>]*>/g, '');
  return ok(sanitized as MessageText);
}

// --- ReportReason ---
export type ReportReason = 'spam' | 'harassment' | 'inappropriate_content' | 'other';

export function ReportReason(value: string): Result<ReportReason, ValidationError> {
  const validReasons: ReportReason[] = ['spam', 'harassment', 'inappropriate_content', 'other'];
  return validReasons.includes(value as ReportReason)
    ? ok(value as ReportReason)
    : err(new ValidationError('無効な報告理由です'));
}

// --- SocketId ---
export type SocketId = Newtype<'SocketId', string>;

export function SocketId(value: string): Result<SocketId, ValidationError> {
  return value.length > 0 ? ok(value as SocketId) : err(new ValidationError('SocketIdが不正です'));
}
