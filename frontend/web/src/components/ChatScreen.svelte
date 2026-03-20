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
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      handleSend();
    }
  }

  function isOwnMessage(senderSessionId: string): boolean {
    return senderSessionId === connectionStore.sessionId;
  }

  const DEPTH_OPACITIES = [1.0, 0.5, 0.2];
  const FADE_DURATION_MS = 30_000;

  let now = $state(Date.now());

  $effect(() => {
    const id = setInterval(() => { now = Date.now(); }, 1000);
    return () => clearInterval(id);
  });

  function getDepthIndex(messageId: string, senderSessionId: string): number {
    const senderMessages = messageStore.messages.filter(
      (m) => m.senderSessionId === senderSessionId,
    );
    const reversed = [...senderMessages].reverse();
    const idx = reversed.findIndex((m) => m.messageId === messageId);
    return Math.min(idx, DEPTH_OPACITIES.length - 1);
  }

  function getMessageOpacity(messageId: string, senderSessionId: string, createdAt: string): number {
    const depthOpacity = DEPTH_OPACITIES[getDepthIndex(messageId, senderSessionId)];
    const age = now - new Date(createdAt).getTime();
    const timeOpacity = Math.max(0, 1 - age / FADE_DURATION_MS);
    return depthOpacity * timeOpacity;
  }

  function seededRandom(seed: string): () => number {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
    }
    return () => {
      h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
      h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
      h = (h ^ (h >>> 16)) >>> 0;
      return (h % 1000) / 1000;
    };
  }

  interface Position {
    readonly top: number;
    readonly left: number;
  }

  const MIN_DIST_Y = 15;
  const MIN_DIST_X = 25;

  const positionCache = new Map<string, Position>();

  function collides(a: Position, b: Position): boolean {
    return Math.abs(a.top - b.top) < MIN_DIST_Y && Math.abs(a.left - b.left) < MIN_DIST_X;
  }

  function resolveCollision(candidate: Position, placed: Position[]): Position {
    let { top, left } = candidate;
    for (let attempt = 0; attempt < 10; attempt++) {
      const hit = placed.some((p) => collides({ top, left }, p));
      if (!hit) break;
      top = ((top + 18) % 70) + 5;
      left = ((left + 22) % 55) + 5;
    }
    return { top, left };
  }

  const messagePositions = $derived.by(() => {
    const positions = new Map<string, Position>();
    const placed: Position[] = [];

    for (const message of messageStore.messages) {
      const cached = positionCache.get(message.messageId);
      if (cached) {
        positions.set(message.messageId, cached);
        placed.push(cached);
        continue;
      }

      const rand = seededRandom(message.messageId);
      const own = isOwnMessage(message.senderSessionId);
      const leftBase = own ? 45 + rand() * 35 : 5 + rand() * 35;
      const candidate: Position = { top: 8 + rand() * 65, left: leftBase };
      const resolved = resolveCollision(candidate, placed);

      positions.set(message.messageId, resolved);
      positionCache.set(message.messageId, resolved);
      placed.push(resolved);
    }

    for (const id of positionCache.keys()) {
      if (!messageStore.messages.some((m) => m.messageId === id)) {
        positionCache.delete(id);
      }
    }

    return positions;
  });

  function getFloatPosition(messageId: string): string {
    const pos = messagePositions.get(messageId);
    if (!pos) return '';
    return `top: ${pos.top}%; left: ${pos.left}%;`;
  }

  const reversedMessages = $derived([...messageStore.messages].reverse());
</script>

<div class="chat-screen">
  <header class="header">
    <button class="leave-button" onclick={handleLeave}>退出</button>
    <div class="timer-area">
      <span class="material-icon" aria-hidden="true">
        <svg viewBox="0 0 24 40" width="16" height="28">
          <rect x="2" y="0" width="20" height="2" rx="1" fill="currentColor" />
          <rect x="2" y="38" width="20" height="2" rx="1" fill="currentColor" />
          <path d="M4 2 L4 14 L12 20 L4 26 L4 38" stroke="currentColor" stroke-width="1.5" fill="none" />
          <path d="M20 2 L20 14 L12 20 L20 26 L20 38" stroke="currentColor" stroke-width="1.5" fill="none" />
        </svg>
      </span>
      <div class="divider"></div>
      <span class="timer" class:timer-warning={isWarningTime(chatStore.remainingSeconds)}>
        {formatTime(chatStore.remainingSeconds)}
      </span>
    </div>
  </header>

  <div class="drift-container">
    {#each reversedMessages as message (message.messageId)}
      <div
        class="message-float"
        style={getFloatPosition(message.messageId)}
      >
        <div
          class="message-opacity"
          style="opacity: {getMessageOpacity(message.messageId, message.senderSessionId, message.createdAt)};"
        >
          <p class="message-text">{message.text}</p>
        </div>
      </div>
    {/each}
  </div>

  <div class="input-area">
    <div class="input-wrapper">
      <input
        class="text-input"
        type="text"
        bind:value={inputText}
        onkeydown={handleKeydown}
        placeholder="ここにささやく..."
        aria-label="メッセージ入力"
      />
      <button class="send-button" onclick={handleSend} aria-label="送信">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
    <div class="dots" aria-hidden="true">
      <span class="dot dot-1"></span>
      <span class="dot dot-2"></span>
      <span class="dot dot-3"></span>
    </div>
  </div>
</div>

<style>
  .chat-screen {
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-width: 800px;
    margin: 0 auto;
    background-color: var(--color-bg);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2.5rem 1.5rem 1rem;
    position: relative;
  }

  .leave-button {
    position: absolute;
    left: 1.5rem;
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    background: none;
    border: none;
    cursor: pointer;
    letter-spacing: 0.05em;
    transition: opacity 0.2s;
  }

  .leave-button:hover {
    opacity: 0.6;
  }

  .timer-area {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    color: var(--color-text-muted);
  }

  .material-icon {
    display: flex;
    align-items: center;
    font-weight: 300;
  }

  .divider {
    width: 1px;
    height: 2rem;
    background-color: var(--color-border);
  }

  .timer {
    font-size: 1.5rem;
    font-weight: 300;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.2em;
    color: var(--color-text-primary);
    transition: color 0.3s;
  }

  .timer-warning {
    color: #b91c1c;
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .drift-container {
    position: relative;
    flex: 1;
    overflow: hidden;
    padding: 1.5rem;
  }

  .message-float {
    position: absolute;
    max-width: 50%;
    font-size: 1.75rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.2;
    animation: entrance 1.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .message-opacity {
    transition: opacity 1s ease;
  }

  @keyframes entrance {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.92);
      filter: blur(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
      filter: blur(0);
    }
  }

  .message-text {
    word-break: break-word;
    white-space: pre-wrap;
  }

  .input-area {
    padding: 0 1.5rem 2.5rem;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .text-input {
    width: 100%;
    padding: 1rem 3.5rem 1rem 2rem;
    font-size: 1.0625rem;
    font-family: inherit;
    background-color: var(--color-input-bg);
    border: none;
    border-radius: 9999px;
    outline: none;
    color: var(--color-text-primary);
    transition: box-shadow 0.2s;
  }

  .text-input:focus {
    box-shadow: 0 0 0 1px var(--color-border);
  }

  .text-input::placeholder {
    color: var(--color-text-muted);
  }

  .send-button {
    position: absolute;
    right: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    color: var(--color-text-muted);
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.2s;
  }

  .send-button:hover {
    color: var(--color-text-primary);
  }

  .dots {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
  }

  .dot-1 { background-color: var(--color-border); }
  .dot-2 { background-color: var(--color-border); opacity: 0.5; }
  .dot-3 { background-color: var(--color-border); opacity: 0.25; }
</style>
