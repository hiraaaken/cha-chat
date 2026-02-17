export type MatchingStatus = 'idle' | 'waiting' | 'matched';

class MatchingStore {
  status = $state<MatchingStatus>('idle');

  startWaiting = () => {
    this.status = 'waiting';
  };

  matched = () => {
    this.status = 'matched';
  };

  reset = () => {
    this.status = 'idle';
  };
}

export const matchingStore = new MatchingStore();
