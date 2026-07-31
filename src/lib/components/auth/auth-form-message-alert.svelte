<script lang="ts">
	import StatusAlert from '$lib/components/status-alert.svelte';
	import type { StatusAlertVariant } from '$lib/components/status-alert.svelte';
	import {
		formatAuthRateLimitMessage,
		isAuthRateLimitMessage,
		type AuthFormMessage
	} from '$lib/shared/auth-messages';

	let {
		message,
		retryAfterSeconds = null,
		variant = 'danger',
		limited = $bindable(false)
	}: {
		message?: AuthFormMessage | null;
		retryAfterSeconds?: number | null;
		variant?: StatusAlertVariant;
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

	const resolvedVariant = $derived<StatusAlertVariant>(
		initialRetryAfter && initialRetryAfter > 0 ? 'warning' : variant
	);
</script>

{#if displayMessage}
	<StatusAlert variant={resolvedVariant}>{displayMessage}</StatusAlert>
{/if}
