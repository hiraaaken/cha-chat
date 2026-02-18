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
      <div class="spinner" aria-hidden="true"></div>
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
    gap: 2rem;
    padding: 1rem;
  }

  .title {
    font-size: 2rem;
    font-weight: bold;
    color: #333;
  }

  .start-button {
    padding: 0.75rem 2rem;
    font-size: 1.125rem;
    font-weight: 600;
    color: #fff;
    background-color: #4f46e5;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .start-button:hover {
    background-color: #4338ca;
  }

  .waiting {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .spinner {
    width: 3rem;
    height: 3rem;
    border: 4px solid #e5e7eb;
    border-top-color: #4f46e5;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .waiting-message {
    font-size: 1rem;
    color: #6b7280;
  }

  .error-message {
    color: #dc2626;
    font-size: 0.875rem;
  }
</style>
