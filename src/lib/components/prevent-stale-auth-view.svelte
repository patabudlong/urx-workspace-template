<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		function handlePageShow(event: PageTransitionEvent) {
			if (!event.persisted) {
				return;
			}

			void invalidateAll();
		}

		window.addEventListener('pageshow', handlePageShow);

		return () => {
			window.removeEventListener('pageshow', handlePageShow);
		};
	});
</script>
