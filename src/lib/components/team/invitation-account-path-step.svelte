<script lang="ts">
	import InvitationWorkspaceSummary from '$lib/components/team/invitation-workspace-summary.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { AUTH_ACTION_BUTTON_CLASS } from '$lib/auth/ui';
	import { cn } from '$lib/utils.js';
	import {
		TEAM_INVITATION_EXISTING_ACCOUNT_DESCRIPTION,
		TEAM_INVITATION_EXISTING_ACCOUNT_HINT,
		TEAM_INVITATION_EXISTING_ACCOUNT_TITLE,
		TEAM_INVITATION_NEW_ACCOUNT_DESCRIPTION,
		TEAM_INVITATION_NEW_ACCOUNT_TITLE
	} from '$lib/shared/team/invitation-account-path';

	type AccountPath = 'existing' | 'new';

	let {
		invitedEmail,
		workspaceName,
		brandLogoUrl = null,
		roleLabel,
		loginHref,
		signupHref,
		inviteeHasAccount = false
	}: {
		invitedEmail: string;
		workspaceName: string;
		brandLogoUrl?: string | null;
		roleLabel: string;
		loginHref: string;
		signupHref: string;
		inviteeHasAccount?: boolean;
	} = $props();

	let selectedPath = $state<AccountPath | null>(null);

	const resolvedPath = $derived(selectedPath ?? (inviteeHasAccount ? 'existing' : null));

	const paths = $derived([
		{
			id: 'existing' as const,
			title: TEAM_INVITATION_EXISTING_ACCOUNT_TITLE,
			description: TEAM_INVITATION_EXISTING_ACCOUNT_DESCRIPTION,
			hint: inviteeHasAccount ? TEAM_INVITATION_EXISTING_ACCOUNT_HINT : null,
			href: loginHref,
			cta: 'Sign in to accept'
		},
		{
			id: 'new' as const,
			title: TEAM_INVITATION_NEW_ACCOUNT_TITLE,
			description: TEAM_INVITATION_NEW_ACCOUNT_DESCRIPTION,
			hint: null,
			href: signupHref,
			cta: 'Create account & join'
		}
	]);

	const activePath = $derived(paths.find((path) => path.id === resolvedPath) ?? null);
</script>

<div class="space-y-5">
	<InvitationWorkspaceSummary
		{workspaceName}
		{brandLogoUrl}
		{roleLabel}
		{invitedEmail}
	/>

	<div class="grid gap-3">
		{#each paths as path (path.id)}
			{@const isSelected = resolvedPath === path.id}
			<button
				type="button"
				class={cn(
					'border-border w-full overflow-hidden rounded-lg border text-left transition-colors',
					'hover:border-primary/40',
					isSelected && 'border-primary ring-primary/20 ring-1'
				)}
				aria-pressed={isSelected}
				onclick={() => {
					selectedPath = path.id;
				}}
			>
				<header
					class={cn(
						'border-border border-b px-4 py-3',
						isSelected ? 'bg-primary/5' : 'bg-muted/30'
					)}
				>
					<h3 class="text-sm font-semibold">{path.title}</h3>
				</header>
				<div class="space-y-2 px-4 py-4">
					<p class="text-muted-foreground text-sm leading-relaxed">{path.description}</p>
					{#if path.hint}
						<p class="text-primary text-xs font-medium">{path.hint}</p>
					{/if}
				</div>
			</button>
		{/each}
	</div>

	{#if activePath}
		<Button href={activePath.href} class={AUTH_ACTION_BUTTON_CLASS}>
			{activePath.cta}
		</Button>
	{/if}
</div>
