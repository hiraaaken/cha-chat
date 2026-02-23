import {
  type ErrorPayload,
  type LeaveRoomPayload,
  type MatchFoundPayload,
  type MessageDeletedPayload,
  type NewMessagePayload,
  type ReportContentPayload,
  type RoomClosedPayload,
  type SendMessagePayload,
  type SessionCreatedPayload,
  type TimerUpdatePayload,
  WebSocketEvents,
} from '@cha-chat/shared-types';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import {
  activate,
  chatStore,
  close,
  selfLeave,
  startCountdown,
  updateRemainingSeconds,
} from '../stores/chatStore.svelte';
import { setConnected, setDisconnected, setError } from '../stores/connectionStore.svelte';
import { matched, startWaiting } from '../stores/matchingStore.svelte';
import { addMessage, clearMessages, removeMessage } from '../stores/messageStore.svelte';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    throw new Error('Socket is not initialized. Call connect() first.');
  }
  return socket;
}

export function connect(): void {
  if (socket?.connected) {
    return;
  }

  if (socket) {
    socket.connect();
    return;
  }

  socket = io(import.meta.env.VITE_WS_URL || '/', {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  registerEventHandlers(socket);
  socket.connect();
}

export function disconnect(): void {
  if (!socket) {
    return;
  }
  socket.disconnect();
  socket = null;
}

function registerEventHandlers(s: Socket): void {
  s.on('connect', () => {
    // セッションIDはサーバーから sessionCreated イベントで受け取る
  });

  s.on(WebSocketEvents.SESSION_CREATED, (payload: SessionCreatedPayload) => {
    setConnected(payload.sessionId);
  });

  s.on('disconnect', () => {
    setDisconnected();
  });

  s.on('connect_error', (err: Error) => {
    setError(err.message);
  });

  s.on(WebSocketEvents.WAITING, () => {
    startWaiting();
  });

  s.on(WebSocketEvents.MATCH_FOUND, (payload: MatchFoundPayload) => {
    matched();
    activate(payload.roomId);
    startCountdown();
  });

  s.on(WebSocketEvents.NEW_MESSAGE, (payload: NewMessagePayload) => {
    addMessage({
      messageId: payload.messageId,
      senderSessionId: payload.senderSessionId,
      text: payload.text,
      createdAt: payload.createdAt,
    });
  });

  s.on(WebSocketEvents.MESSAGE_DELETED, (payload: MessageDeletedPayload) => {
    removeMessage(payload.messageId);
  });

  s.on(WebSocketEvents.ROOM_CLOSED, (payload: RoomClosedPayload) => {
    if (chatStore.roomStatus === 'closed') return;
    close(payload.reason);
    clearMessages();
  });

  s.on(WebSocketEvents.TIMER_UPDATE, (payload: TimerUpdatePayload) => {
    updateRemainingSeconds(payload.remainingSeconds);
  });

  s.on(WebSocketEvents.ERROR, (payload: ErrorPayload) => {
    setError(payload.message);
  });
}

export function requestMatch(): void {
  getSocket().emit(WebSocketEvents.REQUEST_MATCH);
}

export function sendMessage(roomId: string, text: string): void {
  const payload: SendMessagePayload = { roomId, text };
  getSocket().emit(WebSocketEvents.SEND_MESSAGE, payload);
}

export function leaveRoom(roomId: string): void {
  selfLeave();
  const payload: LeaveRoomPayload = { roomId };
  getSocket().emit(WebSocketEvents.LEAVE_ROOM, payload);
}

export function reportContent(roomId: string, reason: ReportContentPayload['reason']): void {
  const payload: ReportContentPayload = { roomId, reason };
  getSocket().emit(WebSocketEvents.REPORT_CONTENT, payload);
}
