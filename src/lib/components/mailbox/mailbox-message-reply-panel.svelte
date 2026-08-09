<script lang="ts">
	import MailboxComposeEditor from '$lib/components/mailbox/mailbox-compose-editor.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { appendMailboxSignatureToBodies } from '$lib/mailbox/signature';
	import { sendMailboxMessage } from '$lib/mailbox/client';
	import {
		buildMailboxComposeDraft,
		htmlToPlainText,
		isMailboxComposeHtmlEmpty,
		parseRecipientInput,
		type MailboxComposeMode
	} from '$lib/mailbox/utils';
	import type { MailboxSignature } from '$lib/shared/mailbox/signature';
	import { isMailboxSignatureConfigured } from '$lib/shared/mailbox/signature';
	import type { MailboxMessageDetail } from '$lib/shared/mailbox/schemas';
	import SendIcon from '@lucide/svelte/icons/send';
	import XIcon from '@lucide/svelte/icons/x';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';

	let {
		mode,
		message,
		userEmail,
		signature = null,
		onClose,
		onSent
	}: {
		mode: MailboxComposeMode;
		message: MailboxMessageDetail;
		userEmail: string;
		signature?: MailboxSignature | null;
		onClose: () => void;
		onSent?: () => void;
	} = $props();

	const draft = $derived(buildMailboxComposeDraft(mode, message, userEmail));
	const panelTitle = $derived(
		mode === 'forward' ? 'Forward' : mode === 'replyAll' ? 'Reply all' : 'Reply'
	);
	const fieldId = $derived(`mailbox-reply-${message.uid}`);
	const signatureConfigured = $derived(isMailboxSignatureConfigured(signature));

	let to = $state('');
	let cc = $state('');
	let subject = $state('');
	let html = $state('');
	let includeSignature = $state(true);
	let submitting = $state(false);
	let sendError = $state<string | null>(null);
	let sendSuccess = $state(false);

	$effect(() => {
		mode;
		message.uid;
		signature;
		const nextDraft = buildMailboxComposeDraft(mode, message, userEmail);
		to = nextDraft.to;
		cc = nextDraft.cc;
		subject = nextDraft.subject;
		html = '';
		includeSignature = signature?.includeByDefault ?? true;
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
		const plainMessage = htmlToPlainText(html);
		const includeQuotedMessage = mode === 'forward';
		const quotedHtml = includeQuotedMessage ? draft.quotedHtml : '';
		const hasUserContent = !isMailboxComposeHtmlEmpty(html);
		const { text: textBody, html: htmlBody } = appendMailboxSignatureToBodies({
			plainMessage: hasUserContent ? plainMessage : '',
			htmlMessage: hasUserContent ? html : '',
			quotedText: includeQuotedMessage ? draft.quotedText : '',
			quotedHtml,
			signature,
			includeSignature: includeSignature && signatureConfigured
		});

		if (!textBody.trim()) {
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
				text: textBody,
				html: htmlBody || undefined
			});
			sendSuccess = true;
			if (onSent) {
				onSent();
			} else {
				onClose();
			}
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
			<MailboxComposeEditor
				id="{fieldId}-text"
				bind:value={html}
				disabled={submitting}
				aria-label="Message body"
			/>
		</div>

		{#if signatureConfigured}
			<div class="flex items-start gap-3">
				<Checkbox
					id="{fieldId}-signature"
					bind:checked={includeSignature}
					disabled={submitting}
				/>
				<Label for="{fieldId}-signature" class="cursor-pointer text-sm font-normal">
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
