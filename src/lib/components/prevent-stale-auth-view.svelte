<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		function reloadForFreshAuthGuard() {
			// BFCache / soft nav can restore authenticated HTML after sign-out.
			window.location.reload();
		}

		function handlePageShow(event: PageTransitionEvent) {
			if (!event.persisted) {
				return;
			}

			reloadForFreshAuthGuard();
		}

		window.addEventListener('pageshow', handlePageShow);

		return () => {
			window.removeEventListener('pageshow', handlePageShow);
		};
	});
</script>
