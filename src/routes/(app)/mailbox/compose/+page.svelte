<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import SendIcon from '@lucide/svelte/icons/send';

	let { data, form } = $props();

	let submitting = $state(false);
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Mailbox"
		title="New message"
		description="Send a message through your connected mailbox. Outbound mail is sent via SMTP and not stored in MongoDB."
	>
		{#snippet actions()}
			<Button href="/mailbox/INBOX" variant="outline" class="h-10">
				<ArrowLeftIcon class="size-4" aria-hidden="true" />
				Back to inbox
			</Button>
		{/snippet}
	</PageHeader>

	{#if !data.configured}
		<StatusAlert
			variant="info"
			title="Connect your mailbox first"
			description="Link your PrivateEmail account in mailbox settings before sending messages."
		/>
		<Button href="/mailbox/settings" class="h-10 w-fit">Go to mailbox settings</Button>
	{:else}
		<Card.Root class="max-w-3xl">
			<Card.Content class="pt-6">
				{#if form?.success}
					<StatusAlert
						variant="success"
						title="Message sent"
						description="Your email was accepted by the mail server."
					/>
				{:else if form?.error}
					<StatusAlert variant="danger" title="Could not send message" description={form.error} />
				{/if}

				<form
					method="POST"
					class="space-y-5"
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							submitting = false;
							await update();
						};
					}}
				>
					<div class="space-y-2">
						<Label for="to">To</Label>
						<Input id="to" name="to" type="text" required autocomplete="email" />
						<p class="text-muted-foreground text-xs">Separate multiple addresses with commas.</p>
					</div>

					<div class="space-y-2">
						<Label for="cc">Cc (optional)</Label>
						<Input id="cc" name="cc" type="text" autocomplete="email" />
					</div>

					<div class="space-y-2">
						<Label for="subject">Subject</Label>
						<Input id="subject" name="subject" type="text" required autocomplete="off" />
					</div>

					<div class="space-y-2">
						<Label for="text">Message</Label>
						<Textarea id="text" name="text" rows={12} required class="min-h-48" />
					</div>

					<Button type="submit" class="h-10" disabled={submitting}>
						<SendIcon class="size-4" aria-hidden="true" />
						{submitting ? 'Sending…' : 'Send message'}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
