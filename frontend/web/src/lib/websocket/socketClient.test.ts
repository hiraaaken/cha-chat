import { WebSocketEvents } from '@cha-chat/shared-types';
import type {
  ErrorPayload,
  MatchFoundPayload,
  MessageDeletedPayload,
  NewMessagePayload,
  RoomClosedPayload,
  TimerUpdatePayload,
} from '@cha-chat/shared-types';
import * as chatStore from '../stores/chatStore.svelte';
import * as connectionStore from '../stores/connectionStore.svelte';
import * as matchingStore from '../stores/matchingStore.svelte';
import * as messageStore from '../stores/messageStore.svelte';

// Socket.IO モック
const eventHandlers = new Map<string, (...args: unknown[]) => void>();
const mockSocket = {
  id: 'test-socket-id',
  connected: false,
  on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
    eventHandlers.set(event, handler);
  }),
  connect: vi.fn(() => {
    mockSocket.connected = true;
  }),
  disconnect: vi.fn(() => {
    mockSocket.connected = false;
  }),
  emit: vi.fn(),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

vi.mock('../stores/connectionStore.svelte', () => ({
  setConnected: vi.fn(),
  setDisconnected: vi.fn(),
  setError: vi.fn(),
}));

vi.mock('../stores/matchingStore.svelte', () => ({
  startWaiting: vi.fn(),
  matched: vi.fn(),
}));

vi.mock('../stores/chatStore.svelte', () => ({
  activate: vi.fn(),
  updateRemainingSeconds: vi.fn(),
  close: vi.fn(),
}));

vi.mock('../stores/messageStore.svelte', () => ({
  addMessage: vi.fn(),
  removeMessage: vi.fn(),
  clearMessages: vi.fn(),
}));

function triggerEvent(event: string, ...args: unknown[]) {
  const handler = eventHandlers.get(event);
  if (handler) {
    handler(...args);
  }
}

describe('socketClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eventHandlers.clear();
    mockSocket.connected = false;
    vi.resetModules();
  });

  describe('connect', () => {
    it('Socket.IO クライアントを生成して接続する', async () => {
      const { io } = await import('socket.io-client');
      const { connect } = await import('./socketClient');

      connect();

      expect(io).toHaveBeenCalledWith(
        '/',
        expect.objectContaining({
          autoConnect: false,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        })
      );
      expect(mockSocket.connect).toHaveBeenCalled();
    });

    it('既に接続中の場合は再接続しない', async () => {
      const { connect } = await import('./socketClient');

      connect();
      mockSocket.connected = true;

      connect();

      expect(mockSocket.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('disconnect', () => {
    it('socket.disconnect() を呼び出す', async () => {
      const { connect, disconnect } = await import('./socketClient');

      connect();
      disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('サーバーイベント受信', () => {
    async function setup() {
      const mod = await import('./socketClient');
      mod.connect();
      return mod;
    }

    it('connect イベントで setConnected を呼ぶ', async () => {
      await setup();
      triggerEvent('connect');
      expect(connectionStore.setConnected).toHaveBeenCalledWith('test-socket-id');
    });

    it('disconnect イベントで setDisconnected を呼ぶ', async () => {
      await setup();
      triggerEvent('disconnect');
      expect(connectionStore.setDisconnected).toHaveBeenCalled();
    });

    it('connect_error イベントで setError を呼ぶ', async () => {
      await setup();
      triggerEvent('connect_error', new Error('接続エラー'));
      expect(connectionStore.setError).toHaveBeenCalledWith('接続エラー');
    });

    it('waiting イベントで startWaiting を呼ぶ', async () => {
      await setup();
      triggerEvent(WebSocketEvents.WAITING);
      expect(matchingStore.startWaiting).toHaveBeenCalled();
    });

    it('matchFound イベントで matched と activate を呼ぶ', async () => {
      await setup();
      const payload: MatchFoundPayload = { roomId: 'room-1', partnerSessionId: 'partner-1' };
      triggerEvent(WebSocketEvents.MATCH_FOUND, payload);
      expect(matchingStore.matched).toHaveBeenCalled();
      expect(chatStore.activate).toHaveBeenCalledWith('room-1');
    });

    it('newMessage イベントで addMessage を呼ぶ', async () => {
      await setup();
      const payload: NewMessagePayload = {
        messageId: 'msg-1',
        senderSessionId: 'sender-1',
        text: 'こんにちは',
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      triggerEvent(WebSocketEvents.NEW_MESSAGE, payload);
      expect(messageStore.addMessage).toHaveBeenCalledWith({
        messageId: 'msg-1',
        senderSessionId: 'sender-1',
        text: 'こんにちは',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });

    it('messageDeleted イベントで removeMessage を呼ぶ', async () => {
      await setup();
      const payload: MessageDeletedPayload = { messageId: 'msg-1' };
      triggerEvent(WebSocketEvents.MESSAGE_DELETED, payload);
      expect(messageStore.removeMessage).toHaveBeenCalledWith('msg-1');
    });

    it('roomClosed イベントで close と clearMessages を呼ぶ', async () => {
      await setup();
      const payload: RoomClosedPayload = { roomId: 'room-1', reason: 'timeout' };
      triggerEvent(WebSocketEvents.ROOM_CLOSED, payload);
      expect(chatStore.close).toHaveBeenCalledWith('timeout');
      expect(messageStore.clearMessages).toHaveBeenCalled();
    });

    it('timerUpdate イベントで updateRemainingSeconds を呼ぶ', async () => {
      await setup();
      const payload: TimerUpdatePayload = { roomId: 'room-1', remainingSeconds: 300 };
      triggerEvent(WebSocketEvents.TIMER_UPDATE, payload);
      expect(chatStore.updateRemainingSeconds).toHaveBeenCalledWith(300);
    });

    it('error イベントで setError を呼ぶ', async () => {
      await setup();
      const payload: ErrorPayload = { code: 'ROOM_FULL', message: 'ルームが満員です' };
      triggerEvent(WebSocketEvents.ERROR, payload);
      expect(connectionStore.setError).toHaveBeenCalledWith('ルームが満員です');
    });
  });

  describe('クライアントイベント送信', () => {
    async function setup() {
      const mod = await import('./socketClient');
      mod.connect();
      return mod;
    }

    it('requestMatch で requestMatch イベントを emit する', async () => {
      const { requestMatch } = await setup();
      requestMatch();
      expect(mockSocket.emit).toHaveBeenCalledWith(WebSocketEvents.REQUEST_MATCH);
    });

    it('sendMessage で sendMessage イベントを emit する', async () => {
      const { sendMessage } = await setup();
      sendMessage('room-1', 'こんにちは');
      expect(mockSocket.emit).toHaveBeenCalledWith(WebSocketEvents.SEND_MESSAGE, {
        roomId: 'room-1',
        text: 'こんにちは',
      });
    });

    it('leaveRoom で leaveRoom イベントを emit する', async () => {
      const { leaveRoom } = await setup();
      leaveRoom('room-1');
      expect(mockSocket.emit).toHaveBeenCalledWith(WebSocketEvents.LEAVE_ROOM, {
        roomId: 'room-1',
      });
    });

    it('reportContent で reportContent イベントを emit する', async () => {
      const { reportContent } = await setup();
      reportContent('room-1', 'spam');
      expect(mockSocket.emit).toHaveBeenCalledWith(WebSocketEvents.REPORT_CONTENT, {
        roomId: 'room-1',
        reason: 'spam',
      });
    });
  });
});
