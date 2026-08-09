<script lang="ts">
	import InvitationWorkspaceSummary from '$lib/components/team/invitation-workspace-summary.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { AUTH_ACTION_BUTTON_CLASS } from '$lib/auth/ui';
	import { cn } from '$lib/utils.js';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';

	let {
		workspaceName,
		brandLogoUrl = null,
		roleLabel,
		invitedEmail,
		expiryLabel = null,
		accepting = false,
		onAccept
	}: {
		workspaceName: string;
		brandLogoUrl?: string | null;
		roleLabel: string;
		invitedEmail: string;
		expiryLabel?: string | null;
		accepting?: boolean;
		onAccept: () => void;
	} = $props();
</script>

<div class="space-y-5">
	<InvitationWorkspaceSummary
		{workspaceName}
		{brandLogoUrl}
		{roleLabel}
		{invitedEmail}
		signedIn
	/>

	{#if expiryLabel}
		<p class="text-muted-foreground text-sm">This invite expires {expiryLabel}.</p>
	{/if}

	<Button
		type="button"
		class={cn(AUTH_ACTION_BUTTON_CLASS, accepting && 'pointer-events-none cursor-wait')}
		disabled={accepting}
		onclick={onAccept}
	>
		{#if accepting}
			<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
			Opening workspace…
		{:else}
			Accept & open workspace
		{/if}
	</Button>
</div>
