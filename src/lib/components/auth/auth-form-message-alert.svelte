<script lang="ts">
	import FormAlert from '$lib/components/auth/form-alert.svelte';
	import {
		formatAuthRateLimitMessage,
		isAuthRateLimitMessage,
		type AuthFormMessage
	} from '$lib/shared/auth-messages';

	let {
		message,
		retryAfterSeconds = null,
		limited = $bindable(false)
	}: {
		message?: AuthFormMessage | null;
		retryAfterSeconds?: number | null;
		limited?: boolean;
	} = $props();

	const alertText = $derived(
		typeof message === 'string'
			? message
			: isAuthRateLimitMessage(message)
				? message.text
				: null
	);

	const initialRetryAfter = $derived(
		isAuthRateLimitMessage(message)
			? message.retryAfterSeconds
			: retryAfterSeconds
	);

	let remaining = $state(0);

	$effect(() => {
		const seconds = initialRetryAfter;

		if (!seconds || seconds <= 0) {
			remaining = 0;
			limited = false;
			return;
		}

		remaining = seconds;
		limited = true;

		const timer = setInterval(() => {
			remaining = Math.max(0, remaining - 1);

			if (remaining <= 0) {
				limited = false;
			}
		}, 1000);

		return () => clearInterval(timer);
	});

	const displayMessage = $derived(
		initialRetryAfter && initialRetryAfter > 0
			? formatAuthRateLimitMessage(remaining)
			: alertText
	);
</script>

{#if displayMessage}
	<FormAlert>{displayMessage}</FormAlert>
{/if}
