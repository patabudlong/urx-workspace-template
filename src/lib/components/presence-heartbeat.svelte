<script lang="ts">
	import { startPresenceHeartbeat } from '$lib/presence/client-presence';
	import { onMount } from 'svelte';

	onMount(() => startPresenceHeartbeat());
</script>
