export type RoomStatus = 'idle' | 'active' | 'closed';
export type RoomCloseReason = 'timeout' | 'user_left' | 'reported';

class ChatStore {
  roomStatus = $state<RoomStatus>('idle');
  roomId = $state<string | null>(null);
  remainingSeconds = $state(0);
  closeReason = $state<RoomCloseReason | null>(null);

  activate = (roomId: string) => {
    this.roomStatus = 'active';
    this.roomId = roomId;
    this.closeReason = null;
  };

  updateRemainingSeconds = (seconds: number) => {
    this.remainingSeconds = seconds;
  };

  close = (reason: RoomCloseReason) => {
    this.roomStatus = 'closed';
    this.closeReason = reason;
  };

  reset = () => {
    this.roomStatus = 'idle';
    this.roomId = null;
    this.remainingSeconds = 0;
    this.closeReason = null;
  };
}

export const chatStore = new ChatStore();
