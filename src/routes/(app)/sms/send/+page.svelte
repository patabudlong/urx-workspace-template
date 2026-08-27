<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { parseContactPhone } from '$lib/shared/phone-country-codes';
	import SendIcon from '@lucide/svelte/icons/send';
	import { enhance } from '$app/forms';

	const DEFAULT_DIAL_CODE = '+63';

	let { data, form } = $props();

	let submitting = $state(false);
	let nationalNumber = $state('');
	let body = $state('');

	const to = $derived.by(() => {
		const digits = nationalNumber.replace(/\D/g, '').replace(/^0+/, '');
		return digits ? `${DEFAULT_DIAL_CODE}${digits}` : '';
	});

	$effect(() => {
		if (form?.values) {
			const parsed = parseContactPhone(form.values.to ?? '');
			if (parsed.iso === 'PH' && parsed.national) {
				nationalNumber = parsed.national;
			} else if (form.values.to?.startsWith(DEFAULT_DIAL_CODE)) {
				nationalNumber = form.values.to.slice(DEFAULT_DIAL_CODE.length).trim();
			} else {
				nationalNumber = form.values.to ?? '';
			}
			body = form.values.body ?? '';
		}
	});
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="SMS"
		title="Send message"
		description="Send a one-off text message through your workspace Twilio account."
	/>

	{#if !data.configured}
		<StatusAlert
			variant="warning"
			title="Twilio not configured"
			description="Add TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, and TWILIO_FROM to your environment before sending messages."
		/>
	{:else if form?.message}
		<StatusAlert
			variant={form.message === 'Message sent successfully.' ? 'success' : 'danger'}
			title={form.message === 'Message sent successfully.' ? 'Message sent' : 'Send failed'}
			description={form.message}
		/>
	{/if}

	<Card.Root class="max-w-2xl">
		<Card.Header>
			<Card.Title>New message</Card.Title>
			<Card.Description>Philippines numbers — enter without country code (e.g. 9171234567).</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				class="space-y-5"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update();
						submitting = false;
					};
				}}
			>
				<div class="space-y-2">
					<Label for="to">To</Label>
					<InputGroup.Root>
						<InputGroup.Addon align="inline-start" class="border-input border-r px-3">
							<span class="text-sm font-medium tabular-nums">{DEFAULT_DIAL_CODE}</span>
						</InputGroup.Addon>
						<InputGroup.Input
							id="to"
							type="tel"
							inputmode="tel"
							autocomplete="tel-national"
							bind:value={nationalNumber}
							disabled={!data.configured || submitting}
						/>
						<input type="hidden" name="to" value={to} />
					</InputGroup.Root>
				</div>

				<div class="space-y-2">
					<Label for="body">Message</Label>
					<Textarea
						id="body"
						name="body"
						rows={5}
						bind:value={body}
						disabled={!data.configured || submitting}
					/>
				</div>

				<Button type="submit" class="h-10" disabled={!data.configured || submitting}>
					<SendIcon class="size-4" aria-hidden="true" />
					{submitting ? 'Sending…' : 'Send message'}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
