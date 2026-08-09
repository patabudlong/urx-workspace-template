<script lang="ts">
	import { enhance } from '$app/forms';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import MailIcon from '@lucide/svelte/icons/mail';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import UnplugIcon from '@lucide/svelte/icons/unplug';

	let { data, form } = $props();

	let submitting = $state(false);
	let disconnecting = $state(false);

	const smtpPortLabel = $derived(
		data.serverDefaults.smtp.port === 587 ? '587 (SSL/TLS)' : '465 (SSL)'
	);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Server settings</Card.Title>
		<Card.Description>
			Uses Namecheap PrivateEmail IMAP for inbox (not POP3). SMTP is verified on ports 465 and 587
			during connect.
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-4 text-sm">
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="space-y-1 rounded-lg border p-4">
				<p class="font-medium">IMAP (incoming)</p>
				<p class="text-muted-foreground">{data.privateEmailReference.imap.host}</p>
				<p class="text-muted-foreground">
					Port {data.privateEmailReference.imap.port} · {data.privateEmailReference.imap.encryption}
				</p>
			</div>
			<div class="space-y-1 rounded-lg border p-4">
				<p class="font-medium">SMTP (outgoing)</p>
				<p class="text-muted-foreground">{data.privateEmailReference.smtp.host}</p>
				<p class="text-muted-foreground">
					Port {smtpPortLabel} · tries 465 then 587 on connect
				</p>
			</div>
		</div>
		<p class="text-muted-foreground text-xs">
			Active defaults: IMAP {data.serverDefaults.imap.host}:{data.serverDefaults.imap.port},
			SMTP {data.serverDefaults.smtp.host}:{data.serverDefaults.smtp.port}. Override via
			<code class="text-foreground">MAILBOX_*</code> env vars if needed.
		</p>
	</Card.Content>
</Card.Root>

<Card.Root>
	<Card.Header>
		<Card.Title>PrivateEmail connection</Card.Title>
		<Card.Description>
			Connect your PrivateEmail account for this workspace user. Credentials are encrypted at rest
			using your app JWT secret. Messages are never stored in MongoDB.
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-6">
		{#if data.connection.connected}
			<div
				class="border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
			>
				<div class="min-w-0 space-y-1">
					<p class="text-sm font-medium">Connected account</p>
					<p class="truncate text-base font-medium">{data.connection.email}</p>
					{#if data.connection.displayName}
						<p class="text-muted-foreground text-sm">{data.connection.displayName}</p>
					{/if}
				</div>
				<Badge variant="secondary" class="w-fit gap-1">
					<ShieldCheckIcon class="size-3" aria-hidden="true" />
					Connected
				</Badge>
			</div>
		{:else}
			<div
				class="bg-muted/40 text-muted-foreground flex h-10 items-center gap-2 rounded-lg border px-3 text-sm"
			>
				<MailIcon class="size-4 shrink-0 opacity-60" aria-hidden="true" />
				No mailbox connected
			</div>
		{/if}

		{#if form?.success}
			<StatusAlert
				variant="success"
				title="Mailbox connected"
				description="Your PrivateEmail account is ready to use in the workspace."
			/>
		{:else if form?.disconnected}
			<StatusAlert
				variant="success"
				title="Mailbox disconnected"
				description="Your stored mailbox credentials were removed from this workspace."
			/>
		{:else if form?.error}
			<StatusAlert variant="danger" title="Could not update mailbox" description={form.error} />
		{/if}

		<form
			method="POST"
			action="?/connect"
			class="space-y-5"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					submitting = false;
					await update({ invalidateAll: true });
				};
			}}
		>
			<div class="space-y-2">
				<Label for="email">Email address</Label>
				<Input
					id="email"
					name="email"
					type="email"
					required
					autocomplete="email"
					value={data.connection.email ?? ''}
				/>
			</div>

			<div class="space-y-2">
				<Label for="password">Password</Label>
				<Input
					id="password"
					name="password"
					type="password"
					required={!data.connection.connected}
					autocomplete="current-password"
				/>
				<p class="text-muted-foreground text-xs">
					{#if data.connection.connected}
						Enter your password again to update the connection.
					{:else}
						Use the password for this mailbox in PrivateEmail, not your Namecheap account login.
					{/if}
				</p>
			</div>

			<div class="space-y-2">
				<Label for="displayName">Display name (optional)</Label>
				<Input
					id="displayName"
					name="displayName"
					type="text"
					autocomplete="name"
					value={data.connection.displayName ?? ''}
				/>
			</div>

			<Button type="submit" class="h-10" disabled={submitting}>
				{submitting
					? 'Connecting…'
					: data.connection.connected
						? 'Update connection'
						: 'Connect mailbox'}
			</Button>
		</form>

		{#if data.connection.connected}
			<form
				method="POST"
				action="?/disconnect"
				use:enhance={() => {
					disconnecting = true;
					return async ({ update }) => {
						disconnecting = false;
						await update({ invalidateAll: true });
					};
				}}
			>
				<Button type="submit" variant="outline" class="h-10" disabled={disconnecting}>
					<UnplugIcon class="size-4" aria-hidden="true" />
					{disconnecting ? 'Disconnecting…' : 'Disconnect mailbox'}
				</Button>
			</form>
		{/if}
	</Card.Content>
</Card.Root>
