<script lang="ts">
	import HttpErrorPage from '$lib/components/http-error-page.svelte';
	import { getHttpErrorPresentation } from '$lib/shared/http-errors';
	import { page } from '$app/state';

	const status = $derived(page.status);
	const message = $derived(
		typeof page.error?.message === 'string' ? page.error.message : undefined
	);
	const presentation = $derived(
		getHttpErrorPresentation(status, {
			message,
			pathname: page.url.pathname
		})
	);
</script>

<HttpErrorPage {status} {presentation} />
