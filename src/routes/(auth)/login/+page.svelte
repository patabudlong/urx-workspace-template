<script lang="ts">
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import ServerIcon from '@lucide/svelte/icons/server';
	import { superForm } from 'sveltekit-superforms';

	let { data } = $props();

	const superform = superForm(data.form);
	const { enhance, message: formMessage } = superform;
</script>

<Card.Root class="border-border/60 shadow-sm">
	<Card.Header class="space-y-4">
		<div class="flex items-center justify-between gap-4">
			<div class="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-lg">
				<ServerIcon class="size-5" />
			</div>
			<ThemeToggle />
		</div>
		<div class="space-y-1">
			<Card.Title class="text-xl">Sign in</Card.Title>
			<Card.Description>Use your URX workspace account to continue.</Card.Description>
		</div>
	</Card.Header>

	<Card.Content>
		<form method="POST" action={`?redirectTo=${encodeURIComponent(data.redirectTo)}`} use:enhance class="space-y-4">
			{#if $formMessage}
				<p class="text-destructive text-sm" role="alert">{$formMessage}</p>
			{/if}

			<Form.Field form={superform} name="email">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Email</Form.Label>
						<Input {...props} type="email" autocomplete="email" placeholder="admin@urx.local" />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field form={superform} name="password">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Password</Form.Label>
						<Input
							{...props}
							type="password"
							autocomplete="current-password"
							placeholder="••••••••"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Button type="submit" class="w-full">Sign in</Button>
		</form>
	</Card.Content>

	<Card.Footer class="text-muted-foreground text-xs">
		Dev seed: run <code class="text-foreground">pnpm seed:user</code> then sign in with
		<code class="text-foreground">admin@urx.local</code>.
	</Card.Footer>
</Card.Root>
