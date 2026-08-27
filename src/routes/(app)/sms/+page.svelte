<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import SendIcon from '@lucide/svelte/icons/send';

	let { data } = $props();

	let messageCount = $state<number | null>(null);

	$effect(() => {
		const nextCount = data.messageCount as Promise<number> | number;

		if (typeof nextCount === 'number') {
			messageCount = nextCount;
		} else if (nextCount && typeof nextCount.then === 'function') {
			messageCount = null;
			void nextCount.then((resolved) => {
				messageCount = resolved;
			});
		} else {
			messageCount = 0;
		}
	});
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="SMS"
		title="Overview"
		description="Send text messages to customers and team members from your workspace using Twilio."
	>
		{#snippet actions()}
			<Button href="/sms/messages" variant="outline" class="h-10">
				<MessageSquareIcon class="size-4" aria-hidden="true" />
				Message log
			</Button>
			<Button href="/sms/send" class="h-10">
				<SendIcon class="size-4" aria-hidden="true" />
				Send message
			</Button>
		{/snippet}
	</PageHeader>

	{#if !data.configured}
		<StatusAlert
			variant="warning"
			title="Twilio not configured"
			description="Add TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, and TWILIO_FROM to your environment before sending messages."
		/>
	{/if}

	<div class="grid gap-6 md:grid-cols-2">
		<Card.Root>
			<Card.Header>
				<Card.Title>Messages sent</Card.Title>
				<Card.Description>Outbound SMS logged for this workspace.</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if messageCount === null}
					<Skeleton class="h-9 w-16" />
				{:else}
					<p class="text-3xl font-semibold tracking-tight">{messageCount}</p>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Provider</Card.Title>
				<Card.Description>Workspace SMS uses Twilio for delivery.</Card.Description>
			</Card.Header>
			<Card.Content>
				<p class="text-sm">
					Status:
					<span class="font-medium">{data.configured ? 'Ready' : 'Not configured'}</span>
				</p>
			</Card.Content>
		</Card.Root>
	</div>
</div>
