<script lang="ts">
	import { navigating } from '$app/state';
	import { actionProgress } from '$lib/action-progress.svelte';

	const SHOW_DELAY_MS = 120;

	$effect(() => {
		const destination = navigating.to;
		if (!destination) {
			return;
		}

		const timeout = setTimeout(() => {
			actionProgress.start();
		}, SHOW_DELAY_MS);

		return () => {
			clearTimeout(timeout);
			actionProgress.stop();
		};
	});
</script>
