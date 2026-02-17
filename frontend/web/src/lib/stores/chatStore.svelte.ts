export type RoomStatus = 'idle' | 'active' | 'closed';
export type RoomCloseReason = 'timeout' | 'user_left' | 'reported';

export const chatStore = $state({
  roomStatus: 'idle' as RoomStatus,
  roomId: null as string | null,
  remainingSeconds: 0,
  closeReason: null as RoomCloseReason | null,
});

export function activate(roomId: string) {
  chatStore.roomStatus = 'active';
  chatStore.roomId = roomId;
  chatStore.closeReason = null;
}

export function updateRemainingSeconds(seconds: number) {
  chatStore.remainingSeconds = seconds;
}

export function close(reason: RoomCloseReason) {
  chatStore.roomStatus = 'closed';
  chatStore.closeReason = reason;
}

export function resetChatStore() {
  chatStore.roomStatus = 'idle';
  chatStore.roomId = null;
  chatStore.remainingSeconds = 0;
  chatStore.closeReason = null;
}
