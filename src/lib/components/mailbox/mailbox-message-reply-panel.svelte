<script lang="ts">
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { sendMailboxMessage } from '$lib/mailbox/client';
	import {
		buildMailboxComposeDraft,
		parseRecipientInput,
		type MailboxComposeMode
	} from '$lib/mailbox/utils';
	import type { MailboxMessageDetail } from '$lib/shared/mailbox/schemas';
	import SendIcon from '@lucide/svelte/icons/send';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		mode,
		message,
		userEmail,
		onClose
	}: {
		mode: MailboxComposeMode;
		message: MailboxMessageDetail;
		userEmail: string;
		onClose: () => void;
	} = $props();

	const draft = $derived(buildMailboxComposeDraft(mode, message, userEmail));
	const panelTitle = $derived(
		mode === 'forward' ? 'Forward' : mode === 'replyAll' ? 'Reply all' : 'Reply'
	);
	const fieldId = $derived(`mailbox-reply-${message.uid}`);

	let to = $state('');
	let cc = $state('');
	let subject = $state('');
	let text = $state('');
	let submitting = $state(false);
	let sendError = $state<string | null>(null);
	let sendSuccess = $state(false);

	$effect(() => {
		mode;
		message.uid;
		const nextDraft = buildMailboxComposeDraft(mode, message, userEmail);
		to = nextDraft.to;
		cc = nextDraft.cc;
		subject = nextDraft.subject;
		text = '';
		sendError = null;
		sendSuccess = false;
	});

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
		const trimmedText = text.trim();
		const body = trimmedText
			? `${trimmedText}${draft.quotedText}`
			: draft.quotedText.trim();

		if (!body) {
			sendError = 'Write a message before sending.';
			return;
		}

		submitting = true;
		sendError = null;
		sendSuccess = false;

		try {
			await sendMailboxMessage({
				to: recipients,
				cc: ccRecipients.length > 0 ? ccRecipients : undefined,
				subject: subject.trim(),
				text: body
			});
			sendSuccess = true;
			onClose();
		} catch (error) {
			sendError = error instanceof Error ? error.message : 'Failed to send message';
		} finally {
			submitting = false;
		}
	}
</script>

<div
	class="border-border bg-muted/30 shrink-0 border-b p-4 sm:p-6"
	role="region"
	aria-label="{panelTitle} to {message.subject}"
>
	<div class="mb-4 flex items-center justify-between gap-3">
		<h3 class="text-foreground text-sm font-semibold">{panelTitle}</h3>
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			aria-label="Close {panelTitle.toLowerCase()}"
			onclick={onClose}
		>
			<XIcon aria-hidden="true" />
		</Button>
	</div>

	{#if sendError}
		<div class="mb-4">
			<StatusAlert variant="danger" title="Could not send message" description={sendError} />
		</div>
	{/if}

	<form class="space-y-4" onsubmit={handleSubmit}>
		<div class="space-y-2">
			<Label for="{fieldId}-to">To</Label>
			<Input id="{fieldId}-to" bind:value={to} type="text" required autocomplete="email" />
		</div>

		{#if mode === 'replyAll' || cc}
			<div class="space-y-2">
				<Label for="{fieldId}-cc">Cc</Label>
				<Input id="{fieldId}-cc" bind:value={cc} type="text" autocomplete="email" />
			</div>
		{/if}

		<div class="space-y-2">
			<Label for="{fieldId}-subject">Subject</Label>
			<Input id="{fieldId}-subject" bind:value={subject} type="text" required autocomplete="off" />
		</div>

		<div class="space-y-2">
			<Label for="{fieldId}-text">Message</Label>
			<Textarea id="{fieldId}-text" bind:value={text} rows={6} class="min-h-32 bg-background" />
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<Button type="submit" class="h-10" disabled={submitting || sendSuccess}>
				<SendIcon class="size-4" aria-hidden="true" />
				{submitting ? 'Sending…' : 'Send'}
			</Button>
			<Button type="button" variant="outline" class="h-10" disabled={submitting} onclick={onClose}>
				Discard
			</Button>
		</div>
	</form>
</div>
