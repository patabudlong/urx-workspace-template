<script lang="ts">
	import MailboxMessageHtml from '$lib/components/mailbox/mailbox-message-html.svelte';
	import type { MailboxMessageDetail } from '$lib/shared/mailbox/schemas';
	import { formatMailboxDate } from '$lib/mailbox/utils';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

	let {
		message,
		layout = 'card',
		loadingBody = false
	}: {
		message: MailboxMessageDetail;
		layout?: 'card' | 'panel';
		loadingBody?: boolean;
	} = $props();
</script>

{#if layout === 'panel'}
	<div>
		<header class="border-border space-y-3 border-b p-4 sm:p-6">
			<h2 class="text-xl leading-snug font-semibold">{message.subject}</h2>
			<div class="text-muted-foreground space-y-1 text-sm">
				<p><span class="text-foreground font-medium">From:</span> {message.from || 'Unknown sender'}</p>
				{#if message.to.length > 0}
					<p><span class="text-foreground font-medium">To:</span> {message.to.join(', ')}</p>
				{/if}
				{#if message.cc.length > 0}
					<p><span class="text-foreground font-medium">Cc:</span> {message.cc.join(', ')}</p>
				{/if}
				<p><span class="text-foreground font-medium">Date:</span> {formatMailboxDate(message.date)}</p>
			</div>
		</header>

		<div class="bg-muted/20 p-4 sm:p-6">
			{#if loadingBody}
				<div class="space-y-3" aria-busy="true" aria-label="Loading message body">
					{#each Array.from({ length: 6 }) as _, index (index)}
						<Skeleton class="h-4 w-full" style="max-width: {88 - (index % 3) * 12}%;" />
					{/each}
				</div>
			{:else if message.html}
				<MailboxMessageHtml html={message.html} />
			{:else}
				<div class="bg-background text-foreground w-fit max-w-full rounded-lg border p-5 sm:p-6">
					<pre class="font-sans text-[15px] leading-7 whitespace-pre-wrap">{message.text}</pre>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<Card.Root class="min-h-0 flex-1">
		<Card.Header class="space-y-3">
			<Card.Title class="text-xl">{message.subject}</Card.Title>
			<div class="text-muted-foreground space-y-1 text-sm">
				<p><span class="text-foreground font-medium">From:</span> {message.from || 'Unknown sender'}</p>
				{#if message.to.length > 0}
					<p><span class="text-foreground font-medium">To:</span> {message.to.join(', ')}</p>
				{/if}
				{#if message.cc.length > 0}
					<p><span class="text-foreground font-medium">Cc:</span> {message.cc.join(', ')}</p>
				{/if}
				<p><span class="text-foreground font-medium">Date:</span> {formatMailboxDate(message.date)}</p>
			</div>
		</Card.Header>
		<Separator />
		<Card.Content class="min-h-0 flex-1 overflow-auto py-6">
			{#if loadingBody}
				<div class="space-y-3" aria-busy="true" aria-label="Loading message body">
					{#each Array.from({ length: 6 }) as _, index (index)}
						<Skeleton class="h-4 w-full" style="max-width: {88 - (index % 3) * 12}%;" />
					{/each}
				</div>
			{:else if message.html}
				<MailboxMessageHtml html={message.html} />
			{:else}
				<pre class="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</pre>
			{/if}
		</Card.Content>
	</Card.Root>
{/if}
