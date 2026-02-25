export type RoomStatus = 'idle' | 'active' | 'closed';
export type RoomCloseReason = 'timeout' | 'user_left' | 'self_left' | 'reported';

interface ChatState {
  roomStatus: RoomStatus;
  roomId: string | null;
  remainingSeconds: number;
  closeReason: RoomCloseReason | null;
}

export const chatStore = $state<ChatState>({
  roomStatus: 'idle',
  roomId: null,
  remainingSeconds: 0,
  closeReason: null,
});

let countdownIntervalId: ReturnType<typeof setInterval> | null = null;

export function activate(roomId: string) {
  chatStore.roomStatus = 'active';
  chatStore.roomId = roomId;
  chatStore.remainingSeconds = 600;
  chatStore.closeReason = null;
}

export function startCountdown() {
  stopCountdown();
  countdownIntervalId = setInterval(() => {
    if (chatStore.remainingSeconds <= 0) {
      close('timeout');
      return;
    }
    chatStore.remainingSeconds -= 1;
  }, 1000);
}

export function stopCountdown() {
  if (countdownIntervalId !== null) {
    clearInterval(countdownIntervalId);
    countdownIntervalId = null;
  }
}

export function updateRemainingSeconds(seconds: number) {
  chatStore.remainingSeconds = seconds;
}

export function close(reason: RoomCloseReason) {
  stopCountdown();
  chatStore.roomStatus = 'closed';
  chatStore.closeReason = reason;
}

export function selfLeave() {
  close('self_left');
}

export function resetChatStore() {
  stopCountdown();
  chatStore.roomStatus = 'idle';
  chatStore.roomId = null;
  chatStore.remainingSeconds = 0;
  chatStore.closeReason = null;
}
