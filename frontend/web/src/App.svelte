<script lang="ts">
  import ChatEndScreen from './components/ChatEndScreen.svelte';
  import ChatScreen from './components/ChatScreen.svelte';
  import MatchingScreen from './components/MatchingScreen.svelte';
  import { chatStore } from './lib/stores/chatStore.svelte';
  import { matchingStore } from './lib/stores/matchingStore.svelte';
</script>

{#if chatStore.roomStatus === 'closed'}
  <ChatEndScreen />
{:else if chatStore.roomStatus === 'active'}
  <ChatScreen />
{:else}
  <MatchingScreen />
{/if}
