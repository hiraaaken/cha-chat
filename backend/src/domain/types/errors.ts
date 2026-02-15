// --- エラーコード ---
export type MatchingErrorCode = 'QUEUE_ERROR' | 'ROOM_CREATION_FAILED' | 'ALREADY_IN_QUEUE';
export type RoomErrorCode = 'ROOM_NOT_FOUND' | 'ROOM_ALREADY_CLOSED' | 'ROOM_DATABASE_ERROR';
export type MessageErrorCode =
  | 'MESSAGE_ROOM_NOT_FOUND'
  | 'MESSAGE_ROOM_CLOSED'
  | 'MESSAGE_DATABASE_ERROR';
export type SessionErrorCode = 'SESSION_NOT_FOUND' | 'SESSION_EXPIRED' | 'SOCKET_ALREADY_BOUND';
export type ReportErrorCode =
  | 'REPORT_ROOM_NOT_FOUND'
  | 'ALREADY_REPORTED'
  | 'REPORT_DATABASE_ERROR';

// --- ベースエラークラス ---
class DomainBaseError<C extends string> extends Error {
  readonly code: C;
  constructor(code: C, message: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

// --- エラークラス ---
export class MatchingError extends DomainBaseError<MatchingErrorCode> {}
export class RoomError extends DomainBaseError<RoomErrorCode> {}
export class MessageError extends DomainBaseError<MessageErrorCode> {}
export class SessionError extends DomainBaseError<SessionErrorCode> {}
export class ReportError extends DomainBaseError<ReportErrorCode> {}

// --- DomainError Union型 ---
export type DomainError =
  | MatchingError
  | RoomError
  | MessageError
  | SessionError
  | ReportError;

// --- エラーコンテキスト ---
export type ErrorCategory = 'TRANSIENT' | 'FATAL' | 'BUSINESS_LOGIC';

export interface ErrorContext {
  readonly category: ErrorCategory;
  readonly code: string;
  readonly message: string;
  readonly userMessage: string;
  readonly retryable: boolean;
  readonly traceId: string;
}

const TRANSIENT_CODES: ReadonlySet<string> = new Set([
  'QUEUE_ERROR',
  'ROOM_CREATION_FAILED',
]);

const FATAL_CODES: ReadonlySet<string> = new Set([
  'ROOM_DATABASE_ERROR',
  'MESSAGE_DATABASE_ERROR',
  'REPORT_DATABASE_ERROR',
]);

export function toErrorContext(error: DomainError, traceId: string): ErrorContext {
  const category = categorize(error.code);
  return {
    category,
    code: error.code,
    message: error.message,
    userMessage: userMessageFor(category),
    retryable: category === 'TRANSIENT',
    traceId,
  };
}

function categorize(code: string): ErrorCategory {
  if (TRANSIENT_CODES.has(code)) return 'TRANSIENT';
  if (FATAL_CODES.has(code)) return 'FATAL';
  return 'BUSINESS_LOGIC';
}

function userMessageFor(category: ErrorCategory): string {
  switch (category) {
    case 'TRANSIENT':
      return 'エラーが発生しました。しばらくしてからお試しください。';
    case 'FATAL':
      return 'システムエラーが発生しました。';
    case 'BUSINESS_LOGIC':
      return '操作を完了できませんでした。';
  }
}
