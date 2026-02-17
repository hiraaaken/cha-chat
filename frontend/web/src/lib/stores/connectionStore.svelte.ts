export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

class ConnectionStore {
  status = $state<ConnectionStatus>('disconnected');
  sessionId = $state<string | null>(null);
  error = $state<string | null>(null);

  setConnecting = () => {
    this.status = 'connecting';
    this.error = null;
  };

  setConnected = (sessionId: string) => {
    this.status = 'connected';
    this.sessionId = sessionId;
    this.error = null;
  };

  setDisconnected = () => {
    this.status = 'disconnected';
    this.sessionId = null;
  };

  setError = (message: string) => {
    this.error = message;
  };

  reset = () => {
    this.status = 'disconnected';
    this.sessionId = null;
    this.error = null;
  };
}

export const connectionStore = new ConnectionStore();
