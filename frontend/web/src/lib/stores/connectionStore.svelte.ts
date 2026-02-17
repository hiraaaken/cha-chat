export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export const connectionStore = $state({
  status: 'disconnected' as ConnectionStatus,
  sessionId: null as string | null,
  error: null as string | null,
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
  connectionStore.sessionId = null;
}

export function setError(message: string) {
  connectionStore.error = message;
}

export function resetConnectionStore() {
  connectionStore.status = 'disconnected';
  connectionStore.sessionId = null;
  connectionStore.error = null;
}
