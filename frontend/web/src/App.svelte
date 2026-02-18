<script lang="ts">
  import MatchingScreen from './components/MatchingScreen.svelte';
  import { matchingStore } from './lib/stores/matchingStore.svelte';
</script>

{#if matchingStore.status === 'idle' || matchingStore.status === 'waiting'}
  <MatchingScreen />
{/if}
