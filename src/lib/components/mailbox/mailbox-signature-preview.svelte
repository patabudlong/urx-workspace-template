<script lang="ts">
	import { buildMailboxSignatureHtml, buildMailboxSignatureText } from '$lib/mailbox/signature';
	import type { MailboxSignature } from '$lib/shared/mailbox/signature';
	import { isMailboxSignatureConfigured } from '$lib/shared/mailbox/signature';
	import { cn } from '$lib/utils.js';

	let {
		signature,
		class: className
	}: {
		signature: MailboxSignature;
		class?: string;
	} = $props();

	const configured = $derived(isMailboxSignatureConfigured(signature));
	const previewHtml = $derived(configured ? buildMailboxSignatureHtml(signature) : '');
	const previewText = $derived(configured ? buildMailboxSignatureText(signature) : '');
</script>

{#if configured}
	<div class={cn('bg-background rounded-lg border p-4', className)}>
		<p class="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">Preview</p>
		<div class="text-sm leading-relaxed">
			{@html previewHtml}
		</div>
		<p class="text-muted-foreground sr-only">{previewText}</p>
	</div>
{:else}
	<div
		class={cn(
			'bg-muted/30 text-muted-foreground rounded-lg border border-dashed p-4 text-sm leading-relaxed',
			className
		)}
	>
		Add your details on the left to preview how your signature will appear in outgoing mail.
	</div>
{/if}
