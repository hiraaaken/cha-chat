<script lang="ts">
  import { connect, requestMatch } from '../lib/websocket';
  import { connectionStore } from '../lib/stores/connectionStore.svelte';
  import { matchingStore } from '../lib/stores/matchingStore.svelte';

  function handleStartMatching() {
    connect();
    requestMatch();
  }
</script>

<div class="matching-screen">
  <h1 class="title">ちゃちゃっと</h1>

  {#if matchingStore.status === 'idle'}
    <button class="start-button" onclick={handleStartMatching}>マッチング開始</button>
  {/if}

  {#if matchingStore.status === 'waiting'}
    <div class="waiting">
      <div class="hourglass" aria-hidden="true">
        <svg viewBox="0 0 48 80" width="40" height="68">
          <rect x="4" y="0" width="40" height="3" rx="1.5" fill="var(--color-text-muted)" />
          <rect x="4" y="77" width="40" height="3" rx="1.5" fill="var(--color-text-muted)" />
          <path d="M8 3 L8 28 L24 40 L8 52 L8 77" stroke="var(--color-text-muted)" stroke-width="2" fill="none" />
          <path d="M40 3 L40 28 L24 40 L40 52 L40 77" stroke="var(--color-text-muted)" stroke-width="2" fill="none" />
          <g class="sand-top">
            <polygon points="12,7 36,7 24,34" fill="var(--color-border)" />
          </g>
          <line class="sand-stream" x1="24" y1="34" x2="24" y2="46" stroke="var(--color-border)" stroke-width="1.5" />
          <g class="sand-bottom">
            <polygon points="12,73 36,73 24,50" fill="var(--color-border)" />
          </g>
        </svg>
      </div>
      <p class="waiting-message">相手を探しています...</p>
    </div>
  {/if}

  {#if connectionStore.error}
    <p class="error-message" role="alert">{connectionStore.error}</p>
  {/if}
</div>

<style>
  .matching-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 3rem;
    padding: 1rem;
    background-color: var(--color-bg);
  }

  .title {
    font-size: 2rem;
    font-weight: 300;
    letter-spacing: 0.25em;
    color: var(--color-text-primary);
  }

  .start-button {
    padding: 0.875rem 2.5rem;
    font-size: 0.9375rem;
    font-weight: 400;
    letter-spacing: 0.1em;
    font-family: inherit;
    color: var(--color-text-primary);
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .start-button:hover {
    background-color: var(--color-text-primary);
    color: var(--color-bg);
  }

  .waiting {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }

  .hourglass svg {
    overflow: visible;
  }

  .sand-top {
    animation: sand-drain 2.5s ease-in-out infinite;
    transform-origin: 24px 7px;
  }

  .sand-bottom {
    animation: sand-fill 2.5s ease-in-out infinite;
    transform-origin: 24px 73px;
  }

  .sand-stream {
    animation: stream-pulse 2.5s ease-in-out infinite;
  }

  @keyframes sand-drain {
    0%, 100% { transform: scaleY(1); opacity: 0.6; }
    45% { transform: scaleY(0.15); opacity: 0.15; }
    50% { transform: scaleY(0.15); opacity: 0; }
    55% { transform: scaleY(1); opacity: 0; }
    60% { opacity: 0.6; }
  }

  @keyframes sand-fill {
    0%, 100% { transform: scaleY(0.15); opacity: 0.15; }
    45% { transform: scaleY(1); opacity: 0.6; }
    50% { transform: scaleY(1); opacity: 0; }
    55% { transform: scaleY(0.15); opacity: 0; }
    60% { opacity: 0.15; }
  }

  @keyframes stream-pulse {
    0%, 48%, 55%, 100% { opacity: 0.4; }
    49%, 54% { opacity: 0; }
  }

  .waiting-message {
    font-size: 0.875rem;
    font-weight: 300;
    color: var(--color-text-muted);
    letter-spacing: 0.1em;
  }

  .error-message {
    color: #b91c1c;
    font-size: 0.8125rem;
    font-weight: 300;
  }
</style>
