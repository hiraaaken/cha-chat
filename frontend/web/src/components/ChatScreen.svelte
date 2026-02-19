<script lang="ts">
  import { sendMessage, leaveRoom } from '../lib/websocket';
  import { chatStore } from '../lib/stores/chatStore.svelte';
  import { connectionStore } from '../lib/stores/connectionStore.svelte';
  import { messageStore } from '../lib/stores/messageStore.svelte';

  let inputText = $state('');

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function handleSend() {
    const text = inputText.trim();
    if (!text || !chatStore.roomId) return;
    sendMessage(chatStore.roomId, text);
    inputText = '';
  }

  function handleLeave() {
    if (!chatStore.roomId) return;
    leaveRoom(chatStore.roomId);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function isOwnMessage(senderSessionId: string): boolean {
    return senderSessionId === connectionStore.sessionId;
  }
</script>

<div class="chat-screen">
  <header class="header">
    <span class="timer">{formatTime(chatStore.remainingSeconds)}</span>
    <button class="leave-button" onclick={handleLeave}>退出</button>
  </header>

  <ul class="message-list">
    {#each messageStore.messages as message (message.messageId)}
      <li class="message-item {isOwnMessage(message.senderSessionId) ? 'own' : 'other'}">
        <span class="message-text">{message.text}</span>
      </li>
    {/each}
  </ul>

  <div class="input-area">
    <input
      class="text-input"
      type="text"
      bind:value={inputText}
      oninput={(e) => { inputText = (e.currentTarget as HTMLInputElement).value; }}
      onkeydown={handleKeydown}
      placeholder="メッセージを入力..."
      aria-label="メッセージ入力"
    />
    <button class="send-button" onclick={handleSend}>送信</button>
  </div>
</div>

<style>
  .chat-screen {
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-width: 600px;
    margin: 0 auto;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background-color: #4f46e5;
    color: #fff;
  }

  .timer {
    font-size: 1.25rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .leave-button {
    padding: 0.25rem 0.75rem;
    font-size: 0.875rem;
    color: #fff;
    background-color: transparent;
    border: 1px solid #fff;
    border-radius: 0.25rem;
    cursor: pointer;
  }

  .leave-button:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }

  .message-list {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    list-style: none;
    margin: 0;
  }

  .message-item {
    display: flex;
    max-width: 75%;
  }

  .message-item.own {
    align-self: flex-end;
  }

  .message-item.other {
    align-self: flex-start;
  }

  .message-text {
    padding: 0.5rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.9375rem;
    word-break: break-word;
    white-space: pre-wrap;
  }

  .message-item.own .message-text {
    background-color: #4f46e5;
    color: #fff;
    border-bottom-right-radius: 0.25rem;
  }

  .message-item.other .message-text {
    background-color: #e5e7eb;
    color: #111827;
    border-bottom-left-radius: 0.25rem;
  }

  .input-area {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-top: 1px solid #e5e7eb;
    background-color: #fff;
  }

  .text-input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    outline: none;
  }

  .text-input:focus {
    border-color: #4f46e5;
  }

  .send-button {
    padding: 0.5rem 1rem;
    font-size: 0.9375rem;
    font-weight: 600;
    color: #fff;
    background-color: #4f46e5;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    white-space: nowrap;
  }

  .send-button:hover {
    background-color: #4338ca;
  }
</style>
