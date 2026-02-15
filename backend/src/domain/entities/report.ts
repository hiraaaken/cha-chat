import { type Result, err, ok } from 'neverthrow';
import type { Newtype } from '../types/base';
import { ValidationError } from '../types/base';
import type { ReportReason, RoomId, SessionId } from '../types/valueObjects';

export type ReportId = Newtype<'ReportId', string>;

export function ReportId(value: string): Result<ReportId, ValidationError> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value)
    ? ok(value as ReportId)
    : err(new ValidationError('ReportIdはUUID v4形式である必要があります'));
}

export interface Report {
  id: ReportId;
  roomId: RoomId;
  reporterSessionId: SessionId;
  reason: ReportReason;
  createdAt: Date;
}

export function createReport(
  id: ReportId,
  roomId: RoomId,
  reporterSessionId: SessionId,
  reason: ReportReason,
  createdAt: Date
): Report {
  return { id, roomId, reporterSessionId, reason, createdAt };
}
