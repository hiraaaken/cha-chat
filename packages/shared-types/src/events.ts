// WebSocket Event Types
// これらの型はフロントエンドとバックエンドで共有されます

/**
 * クライアントからサーバーへ送信されるイベント
 */

// マッチングリクエスト
export interface RequestMatchPayload {}

// メッセージ送信
export interface SendMessagePayload {
  roomId: string;
  text: string;
}

// チャットルーム退出
export interface LeaveRoomPayload {
  roomId: string;
}

// 不適切コンテンツ報告
export interface ReportContentPayload {
  roomId: string;
  reason: 'spam' | 'harassment' | 'inappropriate_content' | 'other';
}

/**
 * サーバーからクライアントへ送信されるイベント
 */

// マッチング成立
export interface MatchFoundPayload {
  roomId: string;
  partnerSessionId: string;
}

// 新規メッセージ
export interface NewMessagePayload {
  messageId: string;
  senderSessionId: string;
  text: string;
  createdAt: string; // ISO 8601 format
}

// メッセージ削除
export interface MessageDeletedPayload {
  messageId: string;
}

// チャットルーム終了
export interface RoomClosedPayload {
  roomId: string;
  reason: 'timeout' | 'user_left' | 'reported';
}

// 相手ユーザー切断
export interface PartnerDisconnectedPayload {
  roomId: string;
}

// タイマー更新
export interface TimerUpdatePayload {
  roomId: string;
  remainingSeconds: number;
}

// エラー
export interface ErrorPayload {
  code: string;
  message: string;
}

/**
 * WebSocketイベント名の定義
 */
export const WebSocketEvents = {
  // Client to Server
  REQUEST_MATCH: 'requestMatch',
  SEND_MESSAGE: 'sendMessage',
  LEAVE_ROOM: 'leaveRoom',
  REPORT_CONTENT: 'reportContent',

  // Server to Client
  WAITING: 'waiting',
  MATCH_FOUND: 'matchFound',
  NEW_MESSAGE: 'newMessage',
  MESSAGE_DELETED: 'messageDeleted',
  ROOM_CLOSED: 'roomClosed',
  PARTNER_DISCONNECTED: 'partnerDisconnected',
  TIMER_UPDATE: 'timerUpdate',
  ERROR: 'error',
} as const;
