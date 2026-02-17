export type MatchingStatus = 'idle' | 'waiting' | 'matched';

export const matchingStore = $state({
  status: 'idle' as MatchingStatus,
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
