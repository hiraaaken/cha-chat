import { err, ok } from 'neverthrow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  DequeueUser,
  EnqueueUser,
  TryMatch,
} from '../../application/interfaces/matchingServiceInterface';
import type {
  MessageServiceInterface,
  SendMessageResult,
} from '../../application/interfaces/messageServiceInterface';
import type { SessionManagerInterface } from '../../application/interfaces/sessionManagerInterface';
import type { Message } from '../../domain/entities/message';
import type { Session } from '../../domain/entities/session';
import { MatchingError, MessageError, SessionError } from '../../domain/types/errors';
import {
  MessageId,
  MessageText,
  RoomId,
  SessionId,
  SocketId,
} from '../../domain/types/valueObjects';
import { handleConnection, handleRequestMatch, handleSendMessage } from './webSocketGateway';

// --- テスト用定数 ---
const testSocketId = SocketId('test-socket-id-abc')._unsafeUnwrap();
const user1SocketId = SocketId('socket-user1-abc')._unsafeUnwrap();
const user2SocketId = SocketId('socket-user2-xyz')._unsafeUnwrap();
const testSessionId = SessionId('00000000-0000-4000-a000-000000000001')._unsafeUnwrap();
const user1SessionId = SessionId('00000000-0000-4000-a000-000000000001')._unsafeUnwrap();
const user2SessionId = SessionId('00000000-0000-4000-a000-000000000002')._unsafeUnwrap();
const testRoomId = RoomId('00000000-0000-4000-a000-000000000099')._unsafeUnwrap();
const testMessageId = MessageId('00000000-0000-4000-a000-000000000088')._unsafeUnwrap();

const testSession: Session = {
  sessionId: testSessionId,
  socketId: testSocketId,
  createdAt: new Date(),
};
const user1Session: Session = {
  sessionId: user1SessionId,
  socketId: user1SocketId,
  createdAt: new Date(),
};
const user2Session: Session = {
  sessionId: user2SessionId,
  socketId: user2SocketId,
  createdAt: new Date(),
};

const testMessage: Message = {
  id: testMessageId,
  roomId: testRoomId,
  senderSessionId: user1SessionId,
  text: MessageText('テストメッセージ')._unsafeUnwrap(),
  createdAt: new Date('2026-02-19T00:00:00Z'),
};

function createMockSocket(id = 'test-socket-id-abc') {
  return {
    id,
    data: {} as Record<string, unknown>,
    emit: vi.fn(),
    on: vi.fn(),
    disconnect: vi.fn(),
    join: vi.fn(),
  };
}

function createMockOps() {
  return {
    emitToSocket: vi.fn(),
    joinSocketToRoom: vi.fn(),
    broadcastToRoom: vi.fn(),
  };
}

// --- handleRequestMatch ---
describe('handleRequestMatch', () => {
  it('enqueueUserが成功しマッチなしの場合にwaitingイベントを発行する', async () => {
    const socket = createMockSocket();
    const enqueueUser: EnqueueUser = vi.fn().mockResolvedValue(ok(undefined));
    const tryMatch: TryMatch = vi.fn().mockResolvedValue(ok(null));
    const sessionManager = {
      generateSession: vi.fn(),
      getSession: vi.fn(),
      invalidateSession: vi.fn(),
      bindSocketToSession: vi.fn(),
    };
    const ops = createMockOps();

    await handleRequestMatch(socket, testSessionId, enqueueUser, tryMatch, sessionManager, ops);

    expect(socket.emit).toHaveBeenCalledWith('waiting');
    expect(tryMatch).toHaveBeenCalled();
    expect(ops.joinSocketToRoom).not.toHaveBeenCalled();
  });

  it('マッチ成立時に両ユーザーにmatchFoundを発行しroomにjoinする', async () => {
    const socket = createMockSocket('socket-user1-abc');
    const enqueueUser: EnqueueUser = vi.fn().mockResolvedValue(ok(undefined));
    const tryMatch: TryMatch = vi
      .fn()
      .mockResolvedValue(ok({ roomId: testRoomId, user1SessionId, user2SessionId }));
    const sessionManager: SessionManagerInterface = {
      generateSession: vi.fn(),
      getSession: vi
        .fn()
        .mockImplementation((id: SessionId) =>
          id === user1SessionId ? ok(user1Session) : ok(user2Session)
        ),
      invalidateSession: vi.fn(),
      bindSocketToSession: vi.fn(),
    };
    const ops = createMockOps();

    await handleRequestMatch(socket, user1SessionId, enqueueUser, tryMatch, sessionManager, ops);

    // 両ユーザーが Socket.IO room に参加
    expect(ops.joinSocketToRoom).toHaveBeenCalledWith(
      user1SocketId as string,
      testRoomId as string
    );
    expect(ops.joinSocketToRoom).toHaveBeenCalledWith(
      user2SocketId as string,
      testRoomId as string
    );
    // 両ユーザーに matchFound
    expect(ops.emitToSocket).toHaveBeenCalledWith(user1SocketId as string, 'matchFound', {
      roomId: testRoomId as string,
      partnerSessionId: user2SessionId as string,
    });
    expect(ops.emitToSocket).toHaveBeenCalledWith(user2SocketId as string, 'matchFound', {
      roomId: testRoomId as string,
      partnerSessionId: user1SessionId as string,
    });
  });

  it('ALREADY_IN_QUEUEエラーの場合にerrorイベントを発行しtryMatchは呼ばない', async () => {
    const socket = createMockSocket();
    const matchingError = new MatchingError('ALREADY_IN_QUEUE', '既にマッチング待機中です');
    const enqueueUser: EnqueueUser = vi.fn().mockResolvedValue(err(matchingError));
    const tryMatch: TryMatch = vi.fn();

    await handleRequestMatch(
      socket,
      testSessionId,
      enqueueUser,
      tryMatch,
      {
        generateSession: vi.fn(),
        getSession: vi.fn(),
        invalidateSession: vi.fn(),
        bindSocketToSession: vi.fn(),
      },
      createMockOps()
    );

    expect(socket.emit).toHaveBeenCalledWith('error', {
      code: 'ALREADY_IN_QUEUE',
      message: '既にマッチング待機中です',
    });
    expect(tryMatch).not.toHaveBeenCalled();
  });
});

// --- handleSendMessage ---
describe('handleSendMessage', () => {
  it('有効なペイロードでメッセージを送信しnewMessageをbroadcastする', async () => {
    const socket = createMockSocket();
    const result: SendMessageResult = { message: testMessage, deletedMessageId: null };
    const messageService: MessageServiceInterface = {
      sendMessage: vi.fn().mockResolvedValue(ok(result)),
      deleteAllMessages: vi.fn(),
      getMessages: vi.fn(),
    };
    const ops = createMockOps();

    await handleSendMessage(
      socket,
      user1SessionId,
      { roomId: testRoomId as string, text: 'テストメッセージ' },
      messageService,
      ops
    );

    expect(messageService.sendMessage).toHaveBeenCalled();
    expect(ops.broadcastToRoom).toHaveBeenCalledWith(
      testRoomId as string,
      'newMessage',
      expect.objectContaining({ messageId: testMessageId as string })
    );
  });

  it('自動削除が発生した場合にmessageDeletedを送信者のみに発行する', async () => {
    const deletedId = MessageId('00000000-0000-4000-a000-000000000077')._unsafeUnwrap();
    const result: SendMessageResult = { message: testMessage, deletedMessageId: deletedId };
    const socket = createMockSocket();
    const messageService: MessageServiceInterface = {
      sendMessage: vi.fn().mockResolvedValue(ok(result)),
      deleteAllMessages: vi.fn(),
      getMessages: vi.fn(),
    };
    const ops = createMockOps();

    await handleSendMessage(
      socket,
      user1SessionId,
      { roomId: testRoomId as string, text: 'テスト' },
      messageService,
      ops
    );

    // 送信者のみに messageDeleted を発行する
    expect(socket.emit).toHaveBeenCalledWith('messageDeleted', {
      messageId: deletedId as string,
    });
    // room 全体にはbroadcastしない
    expect(ops.broadcastToRoom).not.toHaveBeenCalledWith(
      testRoomId as string,
      'messageDeleted',
      expect.any(Object)
    );
  });

  it('無効なroomIdの場合にerrorイベントを発行する', async () => {
    const socket = createMockSocket();
    const messageService: MessageServiceInterface = {
      sendMessage: vi.fn(),
      deleteAllMessages: vi.fn(),
      getMessages: vi.fn(),
    };

    await handleSendMessage(
      socket,
      user1SessionId,
      { roomId: 'invalid-room-id', text: 'テスト' },
      messageService,
      createMockOps()
    );

    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ code: 'VALIDATION_ERROR' })
    );
    expect(messageService.sendMessage).not.toHaveBeenCalled();
  });

  it('空のtextの場合にerrorイベントを発行する', async () => {
    const socket = createMockSocket();
    const messageService: MessageServiceInterface = {
      sendMessage: vi.fn(),
      deleteAllMessages: vi.fn(),
      getMessages: vi.fn(),
    };

    await handleSendMessage(
      socket,
      user1SessionId,
      { roomId: testRoomId as string, text: '' },
      messageService,
      createMockOps()
    );

    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ code: 'VALIDATION_ERROR' })
    );
    expect(messageService.sendMessage).not.toHaveBeenCalled();
  });

  it('MessageServiceがエラーを返した場合にerrorイベントを発行する', async () => {
    const socket = createMockSocket();
    const messageError = new MessageError('MESSAGE_ROOM_NOT_FOUND', 'ルームが見つかりません');
    const messageService: MessageServiceInterface = {
      sendMessage: vi.fn().mockResolvedValue(err(messageError)),
      deleteAllMessages: vi.fn(),
      getMessages: vi.fn(),
    };

    await handleSendMessage(
      socket,
      user1SessionId,
      { roomId: testRoomId as string, text: 'テスト' },
      messageService,
      createMockOps()
    );

    expect(socket.emit).toHaveBeenCalledWith('error', {
      code: 'MESSAGE_ROOM_NOT_FOUND',
      message: 'ルームが見つかりません',
    });
  });
});

// --- handleConnection ---
describe('handleConnection', () => {
  let sessionManager: SessionManagerInterface;
  let enqueueUser: EnqueueUser;
  let dequeueUser: DequeueUser;
  let tryMatch: TryMatch;
  let messageService: MessageServiceInterface;

  beforeEach(() => {
    sessionManager = {
      generateSession: vi.fn().mockReturnValue(ok(testSession)),
      getSession: vi.fn().mockReturnValue(ok(testSession)),
      invalidateSession: vi.fn().mockReturnValue(ok(undefined)),
      bindSocketToSession: vi.fn().mockReturnValue(ok(undefined)),
    };
    enqueueUser = vi.fn().mockResolvedValue(ok(undefined));
    dequeueUser = vi.fn().mockResolvedValue(ok(undefined));
    tryMatch = vi.fn().mockResolvedValue(ok(null));
    messageService = {
      sendMessage: vi.fn().mockResolvedValue(ok({ message: testMessage, deletedMessageId: null })),
      deleteAllMessages: vi.fn().mockResolvedValue(ok(undefined)),
      getMessages: vi.fn(),
    };
  });

  it('接続時にセッションを生成しsessionCreatedを発行する', () => {
    const socket = createMockSocket();
    handleConnection(
      socket,
      sessionManager,
      enqueueUser,
      dequeueUser,
      tryMatch,
      messageService,
      createMockOps()
    );
    expect(sessionManager.generateSession).toHaveBeenCalledWith(expect.any(String));
    expect(socket.emit).toHaveBeenCalledWith('sessionCreated', {
      sessionId: testSessionId as string,
    });
  });

  it('セッション生成失敗時にerrorイベントを発行してdisconnectする', () => {
    const socket = createMockSocket();
    const sessionError = new SessionError('SESSION_NOT_FOUND', 'セッション生成に失敗しました');
    vi.mocked(sessionManager.generateSession).mockReturnValue(err(sessionError));

    handleConnection(
      socket,
      sessionManager,
      enqueueUser,
      dequeueUser,
      tryMatch,
      messageService,
      createMockOps()
    );

    expect(socket.emit).toHaveBeenCalledWith('error', {
      code: 'SESSION_ERROR',
      message: 'セッション生成に失敗しました',
    });
    expect(socket.disconnect).toHaveBeenCalled();
  });

  it('requestMatch・sendMessage・leaveRoom・disconnectイベントリスナーを登録する', () => {
    const socket = createMockSocket();
    handleConnection(
      socket,
      sessionManager,
      enqueueUser,
      dequeueUser,
      tryMatch,
      messageService,
      createMockOps()
    );

    const eventNames = vi.mocked(socket.on).mock.calls.map(([event]) => event);
    expect(eventNames).toContain('requestMatch');
    expect(eventNames).toContain('sendMessage');
    expect(eventNames).toContain('leaveRoom');
    expect(eventNames).toContain('disconnect');
  });

  it('disconnect時にdequeueUserとinvalidateSessionを呼び出す', async () => {
    const socket = createMockSocket();
    handleConnection(
      socket,
      sessionManager,
      enqueueUser,
      dequeueUser,
      tryMatch,
      messageService,
      createMockOps()
    );

    const disconnectHandler = vi
      .mocked(socket.on)
      .mock.calls.find(([event]) => event === 'disconnect')?.[1] as () => Promise<void>;
    await disconnectHandler();

    expect(dequeueUser).toHaveBeenCalledWith(testSessionId);
    expect(sessionManager.invalidateSession).toHaveBeenCalledWith(testSessionId);
  });

  it('requestMatchイベント受信時にenqueueUserを呼び出しwaitingを発行する', async () => {
    const socket = createMockSocket();
    handleConnection(
      socket,
      sessionManager,
      enqueueUser,
      dequeueUser,
      tryMatch,
      messageService,
      createMockOps()
    );

    const requestMatchHandler = vi
      .mocked(socket.on)
      .mock.calls.find(([event]) => event === 'requestMatch')?.[1] as () => Promise<void>;
    await requestMatchHandler();

    expect(enqueueUser).toHaveBeenCalledWith(testSessionId);
    expect(socket.emit).toHaveBeenCalledWith('waiting');
  });

  it('sendMessageイベント受信時にbroadcastToRoomが呼ばれる', async () => {
    const socket = createMockSocket();
    const ops = createMockOps();
    handleConnection(socket, sessionManager, enqueueUser, dequeueUser, tryMatch, messageService, ops);

    const sendMessageHandler = vi
      .mocked(socket.on)
      .mock.calls.find(([event]) => event === 'sendMessage')?.[1] as (p: unknown) => Promise<void>;
    await sendMessageHandler({ roomId: testRoomId as string, text: 'テスト' });

    expect(messageService.sendMessage).toHaveBeenCalled();
    expect(ops.broadcastToRoom).toHaveBeenCalledWith(
      testRoomId as string,
      'newMessage',
      expect.any(Object)
    );
  });

  it('leaveRoomイベント受信時にroomClosedをbroadcastしメッセージを削除する', async () => {
    const socket = createMockSocket();
    const ops = createMockOps();
    handleConnection(socket, sessionManager, enqueueUser, dequeueUser, tryMatch, messageService, ops);

    const leaveRoomHandler = vi
      .mocked(socket.on)
      .mock.calls.find(([event]) => event === 'leaveRoom')?.[1] as (p: unknown) => Promise<void>;
    await leaveRoomHandler({ roomId: testRoomId as string });

    expect(ops.broadcastToRoom).toHaveBeenCalledWith(testRoomId as string, 'roomClosed', {
      roomId: testRoomId as string,
      reason: 'user_left',
    });
    expect(messageService.deleteAllMessages).toHaveBeenCalledWith(testRoomId);
  });
});
