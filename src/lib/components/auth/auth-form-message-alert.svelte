<script lang="ts">
	import StatusAlert, { type StatusAlertVariant } from '$lib/components/status-alert.svelte';
	import {
		formatAuthRateLimitMessage,
		isAuthRateLimitMessage,
		resolveAuthFormAlertPresentation,
		type AuthFormMessage
	} from '$lib/shared/auth-messages';

	let {
		message,
		retryAfterSeconds = null,
		variant = 'danger',
		title,
		limited = $bindable(false)
	}: {
		message?: AuthFormMessage | null;
		retryAfterSeconds?: number | null;
		variant?: StatusAlertVariant;
		title?: string;
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

	const presentation = $derived.by(() => {
		if (!alertText) {
			return null;
		}

		if (initialRetryAfter && initialRetryAfter > 0) {
			return {
				title: 'Too many attempts',
				description: formatAuthRateLimitMessage(remaining),
				variant: 'warning' as const
			};
		}

		return resolveAuthFormAlertPresentation(alertText);
	});

	const resolvedVariant = $derived<StatusAlertVariant>(
		initialRetryAfter && initialRetryAfter > 0
			? 'warning'
			: (presentation?.variant ?? variant)
	);

	const resolvedTitle = $derived(title ?? presentation?.title ?? '');
	const resolvedDescription = $derived(presentation?.description ?? '');
</script>

{#if presentation}
	<StatusAlert
		variant={resolvedVariant}
		title={resolvedTitle}
		description={resolvedDescription}
	/>
{/if}
