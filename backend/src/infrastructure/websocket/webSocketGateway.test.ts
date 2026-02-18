import { err, ok } from 'neverthrow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EnqueueUser } from '../../application/interfaces/matchingServiceInterface';
import type { SessionManagerInterface } from '../../application/interfaces/sessionManagerInterface';
import type { Session } from '../../domain/entities/session';
import { MatchingError, SessionError } from '../../domain/types/errors';
import { SessionId, SocketId } from '../../domain/types/valueObjects';
import { handleConnection, handleRequestMatch } from './webSocketGateway';

const testSocketId = SocketId('test-socket-id-abc')._unsafeUnwrap();
const testSessionId = SessionId('00000000-0000-4000-a000-000000000001')._unsafeUnwrap();
const testSession: Session = {
  sessionId: testSessionId,
  socketId: testSocketId,
  createdAt: new Date(),
};

function createMockSocket(id = 'test-socket-id-abc') {
  return {
    id,
    data: {} as Record<string, unknown>,
    emit: vi.fn(),
    on: vi.fn(),
    disconnect: vi.fn(),
  };
}

describe('handleRequestMatch', () => {
  it('enqueueUserが成功した場合にwaitingイベントを発行する', async () => {
    const socket = createMockSocket();
    const enqueueUser: EnqueueUser = vi.fn().mockResolvedValue(ok(undefined));

    await handleRequestMatch(socket, testSessionId, enqueueUser);

    expect(enqueueUser).toHaveBeenCalledWith(testSessionId);
    expect(socket.emit).toHaveBeenCalledWith('waiting');
  });

  it('ALREADY_IN_QUEUEエラーの場合にerrorイベントを発行する', async () => {
    const socket = createMockSocket();
    const matchingError = new MatchingError('ALREADY_IN_QUEUE', '既にマッチング待機中です');
    const enqueueUser: EnqueueUser = vi.fn().mockResolvedValue(err(matchingError));

    await handleRequestMatch(socket, testSessionId, enqueueUser);

    expect(socket.emit).toHaveBeenCalledWith('error', {
      code: 'ALREADY_IN_QUEUE',
      message: '既にマッチング待機中です',
    });
  });

  it('QUEUE_ERRORの場合にerrorイベントを発行する', async () => {
    const socket = createMockSocket();
    const matchingError = new MatchingError('QUEUE_ERROR', 'キューエラーが発生しました');
    const enqueueUser: EnqueueUser = vi.fn().mockResolvedValue(err(matchingError));

    await handleRequestMatch(socket, testSessionId, enqueueUser);

    expect(socket.emit).toHaveBeenCalledWith('error', {
      code: 'QUEUE_ERROR',
      message: 'キューエラーが発生しました',
    });
  });
});

describe('handleConnection', () => {
  let sessionManager: SessionManagerInterface;
  let enqueueUser: EnqueueUser;

  beforeEach(() => {
    sessionManager = {
      generateSession: vi.fn().mockReturnValue(ok(testSession)),
      getSession: vi.fn().mockReturnValue(ok(testSession)),
      invalidateSession: vi.fn().mockReturnValue(ok(undefined)),
      bindSocketToSession: vi.fn().mockReturnValue(ok(undefined)),
    };
    enqueueUser = vi.fn().mockResolvedValue(ok(undefined));
  });

  it('接続時にセッションを生成する', () => {
    const socket = createMockSocket();

    handleConnection(socket, sessionManager, enqueueUser);

    expect(sessionManager.generateSession).toHaveBeenCalledWith(expect.any(String));
  });

  it('セッション生成失敗時にerrorイベントを発行してdisconnectする', () => {
    const socket = createMockSocket();
    const sessionError = new SessionError('SESSION_NOT_FOUND', 'セッション生成に失敗しました');
    vi.mocked(sessionManager.generateSession).mockReturnValue(err(sessionError));

    handleConnection(socket, sessionManager, enqueueUser);

    expect(socket.emit).toHaveBeenCalledWith('error', {
      code: 'SESSION_ERROR',
      message: 'セッション生成に失敗しました',
    });
    expect(socket.disconnect).toHaveBeenCalled();
  });

  it('requestMatchイベントリスナーを登録する', () => {
    const socket = createMockSocket();

    handleConnection(socket, sessionManager, enqueueUser);

    const onCalls = vi.mocked(socket.on).mock.calls;
    const eventNames = onCalls.map(([event]) => event);
    expect(eventNames).toContain('requestMatch');
  });

  it('disconnectイベントリスナーを登録する', () => {
    const socket = createMockSocket();

    handleConnection(socket, sessionManager, enqueueUser);

    const onCalls = vi.mocked(socket.on).mock.calls;
    const eventNames = onCalls.map(([event]) => event);
    expect(eventNames).toContain('disconnect');
  });

  it('disconnect時にセッションを無効化する', () => {
    const socket = createMockSocket();

    handleConnection(socket, sessionManager, enqueueUser);

    const onCalls = vi.mocked(socket.on).mock.calls;
    const disconnectCall = onCalls.find(([event]) => event === 'disconnect');
    expect(disconnectCall).toBeDefined();

    const disconnectHandler = disconnectCall?.[1] as () => void;
    disconnectHandler();

    expect(sessionManager.invalidateSession).toHaveBeenCalledWith(testSessionId);
  });

  it('requestMatchイベント受信時にenqueueUserを呼び出しwaitingを発行する', async () => {
    const socket = createMockSocket();

    handleConnection(socket, sessionManager, enqueueUser);

    const onCalls = vi.mocked(socket.on).mock.calls;
    const requestMatchCall = onCalls.find(([event]) => event === 'requestMatch');
    expect(requestMatchCall).toBeDefined();

    const requestMatchHandler = requestMatchCall?.[1] as () => Promise<void>;
    await requestMatchHandler();

    expect(enqueueUser).toHaveBeenCalledWith(testSessionId);
    expect(socket.emit).toHaveBeenCalledWith('waiting');
  });
});
