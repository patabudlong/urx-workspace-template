<script lang="ts">
	import MailboxComposeEditor from '$lib/components/mailbox/mailbox-compose-editor.svelte';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { appendMailboxSignatureToBodies } from '$lib/mailbox/signature';
	import { sendMailboxMessage } from '$lib/mailbox/client';
	import {
		htmlToPlainText,
		isMailboxComposeHtmlEmpty,
		parseRecipientInput
	} from '$lib/mailbox/utils';
	import { isMailboxSignatureConfigured } from '$lib/shared/mailbox/signature';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import SendIcon from '@lucide/svelte/icons/send';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	const signature = $derived(page.data.signature);
	const signatureConfigured = $derived(isMailboxSignatureConfigured(signature));

	let to = $state('');
	let cc = $state('');
	let subject = $state('');
	let html = $state('');
	let includeSignature = $state(true);
	let submitting = $state(false);
	let sendError = $state<string | null>(null);

	$effect(() => {
		signature;
		includeSignature = signature?.includeByDefault ?? true;
	});

	function resetForm() {
		to = '';
		cc = '';
		subject = '';
		html = '';
		includeSignature = signature?.includeByDefault ?? true;
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (submitting) {
			return;
		}

		const recipients = parseRecipientInput(to);
		if (recipients.length === 0) {
			sendError = 'Add at least one recipient.';
			return;
		}

		const ccRecipients = parseRecipientInput(cc);
		const plainMessage = htmlToPlainText(html);
		const hasUserContent = !isMailboxComposeHtmlEmpty(html);
		const { text: textBody, html: htmlBody } = appendMailboxSignatureToBodies({
			plainMessage: hasUserContent ? plainMessage : '',
			htmlMessage: hasUserContent ? html : '',
			quotedText: '',
			quotedHtml: '',
			signature,
			includeSignature: includeSignature && signatureConfigured
		});

		if (!textBody.trim()) {
			sendError = 'Write a message before sending.';
			return;
		}

		submitting = true;
		sendError = null;

		try {
			await sendMailboxMessage({
				to: recipients,
				cc: ccRecipients.length > 0 ? ccRecipients : undefined,
				subject: subject.trim(),
				text: textBody,
				html: htmlBody || undefined
			});
			toast.success('Email sent', {
				description: 'Your message was delivered successfully.'
			});
			resetForm();
		} catch (error) {
			sendError = error instanceof Error ? error.message : 'Failed to send message';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Mailbox"
		title="Compose"
		description="Send a message through your connected mailbox. Delivered via SMTP and saved to your Sent folder."
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
				{#if sendError}
					<div class="mb-5">
						<StatusAlert variant="danger" title="Could not send message" description={sendError} />
					</div>
				{/if}

				<form class="space-y-5" onsubmit={handleSubmit}>
					<div class="space-y-2">
						<Label for="compose-to">To</Label>
						<Input
							id="compose-to"
							bind:value={to}
							type="text"
							required
							autocomplete="email"
							disabled={submitting}
						/>
						<p class="text-muted-foreground text-xs">Separate multiple addresses with commas.</p>
					</div>

					<div class="space-y-2">
						<Label for="compose-cc">Cc (optional)</Label>
						<Input
							id="compose-cc"
							bind:value={cc}
							type="text"
							autocomplete="email"
							disabled={submitting}
						/>
					</div>

					<div class="space-y-2">
						<Label for="compose-subject">Subject</Label>
						<Input
							id="compose-subject"
							bind:value={subject}
							type="text"
							required
							autocomplete="off"
							disabled={submitting}
						/>
					</div>

					<div class="space-y-2">
						<Label for="compose-message">Message</Label>
						<MailboxComposeEditor
							id="compose-message"
							bind:value={html}
							disabled={submitting}
							aria-label="Message body"
						/>
					</div>

					{#if signatureConfigured}
						<div class="flex items-start gap-3">
							<Checkbox
								id="compose-signature"
								bind:checked={includeSignature}
								disabled={submitting}
							/>
							<Label for="compose-signature" class="cursor-pointer text-sm font-normal">
								Include signature
							</Label>
						</div>
					{:else}
						<p class="text-muted-foreground text-sm">
							<a href="/mailbox/settings/signature" class="text-primary font-medium hover:underline">
								Set up your email signature
							</a>
							to add your name, role, and contact details to outgoing mail.
						</p>
					{/if}

					<Button type="submit" class="h-10" disabled={submitting}>
						<SendIcon class="size-4" aria-hidden="true" />
						{submitting ? 'Sending…' : 'Send message'}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
