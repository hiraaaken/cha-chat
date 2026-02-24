export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

interface ConnectionState {
  status: ConnectionStatus;
  sessionId: string | null;
  error: string | null;
}

export const connectionStore = $state<ConnectionState>({
  status: 'disconnected',
  sessionId: null,
  error: null,
});

export function setConnecting() {
  connectionStore.status = 'connecting';
  connectionStore.error = null;
}

export function setConnected(sessionId: string) {
  connectionStore.status = 'connected';
  connectionStore.sessionId = sessionId;
  connectionStore.error = null;
}

export function setDisconnected() {
  connectionStore.status = 'disconnected';
}

export function setError(message: string) {
  connectionStore.error = message;
}

export function resetConnectionStore() {
  connectionStore.status = 'disconnected';
  connectionStore.sessionId = null;
  connectionStore.error = null;
}
