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

  function isWarningTime(seconds: number): boolean {
    return seconds < 60;
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

  interface DepthStyle {
    opacity: number;
    scale: number;
  }

  const DEPTH_STYLES: DepthStyle[] = [
    { opacity: 1.0, scale: 1.0 },
    { opacity: 0.45, scale: 0.88 },
    { opacity: 0.2, scale: 0.78 },
  ];

  function getDepthIndex(messageId: string, senderSessionId: string): number {
    const senderMessages = messageStore.messages.filter(
      (m) => m.senderSessionId === senderSessionId,
    );
    const reversed = [...senderMessages].reverse();
    const idx = reversed.findIndex((m) => m.messageId === messageId);
    return Math.min(idx, DEPTH_STYLES.length - 1);
  }

  function getMessageStyle(messageId: string, senderSessionId: string): string {
    const idx = getDepthIndex(messageId, senderSessionId);
    const { opacity, scale } = DEPTH_STYLES[idx];
    return `opacity: ${opacity}; transform: scale(${scale}); transform-origin: ${isOwnMessage(senderSessionId) ? 'right' : 'left'} bottom;`;
  }
</script>

<div class="chat-screen">
  <header class="header">
    <span class="timer" class:timer-warning={isWarningTime(chatStore.remainingSeconds)}>
      {formatTime(chatStore.remainingSeconds)}
    </span>
    <button class="leave-button" onclick={handleLeave}>退出</button>
  </header>

  <div class="message-area">
    <ul class="message-list">
      {#each messageStore.messages as message (message.messageId)}
        <li
          class="message-item {isOwnMessage(message.senderSessionId) ? 'own' : 'other'}"
          style={getMessageStyle(message.messageId, message.senderSessionId)}
        >
          <div class="bubble">
            <span class="message-text">{message.text}</span>
          </div>
        </li>
      {/each}
    </ul>
  </div>

  <div class="input-area">
    <input
      class="text-input"
      type="text"
      bind:value={inputText}
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
    transition: color 0.3s;
  }

  .timer-warning {
    color: #fca5a5;
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
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

  .message-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow-y: auto;
    padding: 1rem;
  }

  .message-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    list-style: none;
    margin: 0 auto;
    padding: 0;
    width: 100%;
    max-width: 400px;
  }

  .message-item {
    display: flex;
    transition: opacity 0.4s ease, transform 0.4s ease;
  }

  .message-item.own {
    justify-content: flex-end;
  }

  .message-item.other {
    justify-content: flex-start;
  }

  .bubble {
    position: relative;
    max-width: 85%;
    padding: 0.625rem 0.875rem;
    border-radius: 1rem;
    font-size: 0.9375rem;
    word-break: break-word;
    white-space: pre-wrap;
    line-height: 1.5;
  }

  .message-item.own .bubble {
    background-color: #4f46e5;
    color: #fff;
    border-bottom-right-radius: 0.25rem;
  }

  .message-item.own .bubble::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: -6px;
    width: 0;
    height: 0;
    border-left: 6px solid #4f46e5;
    border-top: 6px solid transparent;
    border-bottom: 0;
  }

  .message-item.other .bubble {
    background-color: #e5e7eb;
    color: #111827;
    border-bottom-left-radius: 0.25rem;
  }

  .message-item.other .bubble::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: -6px;
    width: 0;
    height: 0;
    border-right: 6px solid #e5e7eb;
    border-top: 6px solid transparent;
    border-bottom: 0;
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
