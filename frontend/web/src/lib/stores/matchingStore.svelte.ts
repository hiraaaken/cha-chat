export type MatchingStatus = 'idle' | 'waiting' | 'matched';

interface MatchingState {
  status: MatchingStatus;
}

export const matchingStore = $state<MatchingState>({
  status: 'idle',
});

export function startWaiting() {
  matchingStore.status = 'waiting';
}

export function matched() {
  matchingStore.status = 'matched';
}

export function resetMatchingStore() {
  matchingStore.status = 'idle';
}
