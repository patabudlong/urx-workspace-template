<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import type { WorkspaceSmsMessageDto } from '$lib/shared/models/workspace-sms-message';

	let { data } = $props();

	let messages = $state<WorkspaceSmsMessageDto[] | null>(null);

	$effect(() => {
		const nextMessages = data.messages as Promise<WorkspaceSmsMessageDto[]> | WorkspaceSmsMessageDto[];

		if (Array.isArray(nextMessages)) {
			messages = nextMessages;
		} else if (nextMessages && typeof nextMessages.then === 'function') {
			messages = null;
			void nextMessages.then((resolved) => {
				messages = resolved;
			});
		} else {
			messages = [];
		}
	});

	function formatDate(value: string): string {
		return new Intl.DateTimeFormat(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="SMS"
		title="Message log"
		description="Recent outbound messages sent from this workspace."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>Recent messages</Card.Title>
			<Card.Description>Newest messages appear first.</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if messages === null}
				<div class="space-y-3">
					<Skeleton class="h-16 w-full" />
					<Skeleton class="h-16 w-full" />
					<Skeleton class="h-16 w-full" />
				</div>
			{:else if messages.length === 0}
				<p class="text-muted-foreground text-sm">No messages yet. Send your first message from the compose page.</p>
			{:else}
				<ul class="divide-border divide-y">
					{#each messages as message (message.id)}
						<li class="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<div class="min-w-0">
									<p class="font-medium">{message.to}</p>
									<p class="text-muted-foreground text-sm">{formatDate(message.createdAt)}</p>
								</div>
								<Badge variant={message.status === 'sent' ? 'secondary' : 'destructive'}>
									{message.status}
								</Badge>
							</div>
							<p class="text-sm whitespace-pre-wrap">{message.body}</p>
							{#if message.error}
								<p class="text-destructive text-sm">{message.error}</p>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
