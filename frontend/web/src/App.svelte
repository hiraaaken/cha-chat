<script lang="ts">
  import ChatScreen from './components/ChatScreen.svelte';
  import MatchingScreen from './components/MatchingScreen.svelte';
  import { chatStore } from './lib/stores/chatStore.svelte';
  import { matchingStore } from './lib/stores/matchingStore.svelte';
</script>

{#if matchingStore.status === 'idle' || matchingStore.status === 'waiting'}
  <MatchingScreen />
{:else if chatStore.roomStatus === 'active'}
  <ChatScreen />
{/if}
