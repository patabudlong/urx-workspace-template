<script lang="ts">
	import WorkspaceAvatar from '$lib/components/workspace-avatar.svelte';

	let {
		workspaceName,
		brandLogoUrl = null,
		roleLabel,
		invitedEmail,
		signedIn = false
	}: {
		workspaceName: string;
		brandLogoUrl?: string | null;
		roleLabel: string;
		invitedEmail: string;
		signedIn?: boolean;
	} = $props();
</script>

<div class="border-border/60 bg-muted/20 rounded-xl border p-4">
	<div class="flex items-center gap-3">
		<WorkspaceAvatar {workspaceName} {brandLogoUrl} class="size-11 text-sm" />
		<div class="min-w-0 space-y-0.5">
			<p class="text-foreground text-sm font-semibold">{workspaceName}</p>
			<p class="text-muted-foreground text-sm">
				{#if signedIn}
					Join as {roleLabel} · <span class="text-foreground font-medium">{invitedEmail}</span>
				{:else}
					Invited as {roleLabel}
				{/if}
			</p>
		</div>
	</div>
</div>
