<script lang="ts">
  import ChatEndScreen from './components/ChatEndScreen.svelte';
  import ChatScreen from './components/ChatScreen.svelte';
  import MatchingScreen from './components/MatchingScreen.svelte';
  import { chatStore } from './lib/stores/chatStore.svelte';
  import { matchingStore } from './lib/stores/matchingStore.svelte';

  let isFadingOut = $state(false);
  let showEndScreen = $state(false);
  let previousRoomStatus = $state(chatStore.roomStatus);

  $effect(() => {
    const current = chatStore.roomStatus;
    if (previousRoomStatus === 'active' && current === 'closed') {
      if (chatStore.closeReason === 'timeout') {
        isFadingOut = true;
        showEndScreen = false;
        setTimeout(() => {
          isFadingOut = false;
          showEndScreen = true;
        }, 2500);
      } else {
        showEndScreen = true;
      }
    }
    if (current === 'idle') {
      isFadingOut = false;
      showEndScreen = false;
    }
    previousRoomStatus = current;
  });
</script>

{#if showEndScreen}
  <ChatEndScreen />
{:else if chatStore.roomStatus === 'active' || isFadingOut}
  <div class="chat-wrapper" class:fade-out={isFadingOut}>
    <ChatScreen />
  </div>
{:else}
  <MatchingScreen />
{/if}

<style>
  .chat-wrapper {
    height: 100%;
    transition: opacity 2.5s ease-out;
  }

  .fade-out {
    opacity: 0;
    pointer-events: none;
  }
</style>
