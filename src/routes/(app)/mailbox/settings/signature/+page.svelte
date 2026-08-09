<script lang="ts">
	import { enhance } from '$app/forms';
	import MailboxSignaturePreview from '$lib/components/mailbox/mailbox-signature-preview.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { EMPTY_MAILBOX_SIGNATURE, isMailboxSignatureConfigured } from '$lib/shared/mailbox/signature';
	import SignatureIcon from '@lucide/svelte/icons/signature';

	let { data, form } = $props();

	let savingSignature = $state(false);
	let signature = $state({ ...EMPTY_MAILBOX_SIGNATURE });
	let includeByDefault = $state(true);

	const signatureConfigured = $derived(isMailboxSignatureConfigured(signature));

	$effect(() => {
		signature = { ...data.signature };
		includeByDefault = data.signature.includeByDefault;
	});
</script>

<Card.Root>
	<Card.Header>
		<div class="flex items-start gap-3">
			<div class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
				<SignatureIcon class="size-5" aria-hidden="true" />
			</div>
			<div class="space-y-1">
				<Card.Title>Email signature</Card.Title>
				<Card.Description>
					Add a professional signature to your outgoing mail. Include your name, role, company
					branding, and contact details.
				</Card.Description>
			</div>
		</div>
	</Card.Header>
	<Card.Content class="space-y-6">
		{#if !data.connection.connected}
			<StatusAlert
				variant="info"
				title="Connect your mailbox first"
				description="Link your PrivateEmail account on the Connection tab before setting up an email signature."
			/>
			<Button href="/mailbox/settings/connection" variant="outline" class="h-10 w-fit">
				Go to connection settings
			</Button>
		{:else}
			{#if form?.signatureSaved}
				<StatusAlert
					variant="success"
					title="Signature saved"
					description="Your signature is ready to use in replies and new messages."
				/>
			{:else if form?.signatureError}
				<StatusAlert
					variant="danger"
					title="Could not save signature"
					description={form.signatureError}
				/>
			{/if}

			<form
				method="POST"
				class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] lg:items-start xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]"
				use:enhance={() => {
					savingSignature = true;
					return async ({ update }) => {
						savingSignature = false;
						await update({ invalidateAll: true });
					};
				}}
			>
				<div class="space-y-6 lg:col-start-1 lg:row-start-1">
					<div class="bg-muted/30 flex items-start gap-3 rounded-lg border p-4">
						<Checkbox
							id="includeByDefault"
							bind:checked={includeByDefault}
							disabled={savingSignature}
						/>
						<div class="space-y-1">
							<Label for="includeByDefault" class="cursor-pointer">
								Include signature in outgoing mail by default
							</Label>
							<p class="text-muted-foreground text-sm">
								When replying or composing, the signature checkbox will start checked.
							</p>
						</div>
						<input type="hidden" name="includeByDefault" value={includeByDefault ? 'on' : ''} />
					</div>

					<div class="grid gap-4 sm:grid-cols-2">
						<div class="space-y-2">
							<Label for="signature-name">Name</Label>
							<Input
								id="signature-name"
								name="name"
								type="text"
								autocomplete="name"
								bind:value={signature.name}
								disabled={savingSignature}
							/>
						</div>
						<div class="space-y-2">
							<Label for="signature-position">Position</Label>
							<Input
								id="signature-position"
								name="position"
								type="text"
								autocomplete="organization-title"
								bind:value={signature.position}
								disabled={savingSignature}
							/>
						</div>
						<div class="space-y-2">
							<Label for="signature-email">Email</Label>
							<Input
								id="signature-email"
								name="email"
								type="email"
								autocomplete="email"
								bind:value={signature.email}
								disabled={savingSignature}
							/>
						</div>
						<div class="space-y-2">
							<Label for="signature-company">Company</Label>
							<Input
								id="signature-company"
								name="companyName"
								type="text"
								autocomplete="organization"
								bind:value={signature.companyName}
								disabled={savingSignature}
							/>
						</div>
						<div class="space-y-2 sm:col-span-2">
							<Label for="signature-logo">Company logo URL</Label>
							<Input
								id="signature-logo"
								name="logoUrl"
								type="url"
								inputmode="url"
								bind:value={signature.logoUrl}
								disabled={savingSignature}
							/>
							<p class="text-muted-foreground text-xs">
								Use a publicly accessible image URL (PNG or SVG recommended, max height 48px).
							</p>
						</div>
						<div class="space-y-2 sm:col-span-2">
							<Label for="signature-website">Website</Label>
							<Input
								id="signature-website"
								name="website"
								type="url"
								inputmode="url"
								bind:value={signature.website}
								disabled={savingSignature}
							/>
						</div>
						<div class="space-y-2">
							<Label for="signature-phone">Phone</Label>
							<Input
								id="signature-phone"
								name="phone"
								type="tel"
								autocomplete="tel"
								bind:value={signature.phone}
								disabled={savingSignature}
							/>
						</div>
						<div class="space-y-2 sm:col-span-2">
							<Label for="signature-address">Office address (optional)</Label>
							<Textarea
								id="signature-address"
								name="address"
								rows={2}
								autocomplete="street-address"
								bind:value={signature.address}
								disabled={savingSignature}
							/>
						</div>
					</div>
				</div>

				<MailboxSignaturePreview
					{signature}
					class="lg:sticky lg:top-4 lg:col-start-2 lg:row-start-1 lg:row-span-2"
				/>

				<Button
					type="submit"
					class="h-10 w-fit lg:col-start-1 lg:row-start-2"
					disabled={savingSignature || !signatureConfigured}
				>
					{savingSignature ? 'Saving…' : 'Save signature'}
				</Button>
			</form>
		{/if}
	</Card.Content>
</Card.Root>
