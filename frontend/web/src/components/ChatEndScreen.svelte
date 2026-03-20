<script lang="ts">
  import { resetChatStore, chatStore } from '../lib/stores/chatStore.svelte';
  import { clearMessages } from '../lib/stores/messageStore.svelte';
  import { resetMatchingStore } from '../lib/stores/matchingStore.svelte';

  const CLOSE_REASON_MESSAGES: Record<string, string> = {
    timeout: '時間切れでチャットが終了しました',
    user_left: '相手が退出しました',
    self_left: 'チャットを終了しました',
    reported: '報告によりチャットが終了しました',
  };

  function closeReasonMessage(): string {
    return CLOSE_REASON_MESSAGES[chatStore.closeReason ?? ''] ?? '';
  }

  function handleNewMatching() {
    resetChatStore();
    clearMessages();
    resetMatchingStore();
  }
</script>

<div class="end-screen">
  <h1 class="end-message">チャットが終了しました</h1>

  {#if chatStore.closeReason}
    <p class="reason">{closeReasonMessage()}</p>
  {/if}

  <button class="new-match-button" onclick={handleNewMatching}>新しいマッチング</button>
</div>

<style>
  .end-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 1.5rem;
    padding: 1rem;
    text-align: center;
    background-color: var(--color-bg);
  }

  .end-message {
    font-size: 1.25rem;
    font-weight: 300;
    letter-spacing: 0.15em;
    color: var(--color-text-primary);
  }

  .reason {
    font-size: 0.8125rem;
    font-weight: 300;
    color: var(--color-text-muted);
    letter-spacing: 0.05em;
  }

  .new-match-button {
    margin-top: 1rem;
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

  .new-match-button:hover {
    background-color: var(--color-text-primary);
    color: var(--color-bg);
  }
</style>
