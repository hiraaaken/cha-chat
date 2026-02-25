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
  <h1 class="title">チャットが終了しました</h1>

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
  }

  .title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #111827;
  }

  .reason {
    font-size: 1rem;
    color: #6b7280;
  }

  .new-match-button {
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

  .new-match-button:hover {
    background-color: #4338ca;
  }
</style>
