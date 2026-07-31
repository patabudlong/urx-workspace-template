<script lang="ts">
	import AuthFormPanel from '$lib/components/auth/auth-form-panel.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';

	let { data } = $props();

	const superform = superForm(untrack(() => data.form));
	const { enhance, message: formMessage } = superform;
</script>

<AuthFormPanel title="Sign in" description="Use your workspace account to access the dashboard and API tools.">
	<form
		method="POST"
		action={`?redirectTo=${encodeURIComponent(data.redirectTo)}`}
		use:enhance
		class="space-y-5"
	>
		{#if $formMessage}
			<div class="bg-destructive/10 text-destructive rounded-lg border border-destructive/20 px-3 py-2 text-sm" role="alert">
				{$formMessage}
			</div>
		{/if}

		<div class="space-y-4">
			<Form.Field form={superform} name="email">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Email</Form.Label>
						<Input {...props} type="email" autocomplete="email" placeholder="you@company.com" />
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
							placeholder="Enter your password"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<Button type="submit" class="h-10 w-full">Sign in</Button>
	</form>

	{#snippet footer()}
		<p>
			Dev seed: run <code class="text-foreground">pnpm seed:user</code>, then sign in with
			<code class="text-foreground">admin@urx.local</code> / <code class="text-foreground">changeme123</code>.
		</p>
	{/snippet}
</AuthFormPanel>
