<script lang="ts">
	import WorkspaceAvatar from '$lib/components/workspace-avatar.svelte';

	let {
		workspaceName,
		brandLogoUrl = null,
		class: className = ''
	}: {
		workspaceName: string;
		brandLogoUrl?: string | null;
		class?: string;
	} = $props();
</script>

<div class="flex flex-row-reverse items-center justify-end gap-3 text-right {className}">
	<WorkspaceAvatar {workspaceName} {brandLogoUrl} class="size-11 shrink-0 text-sm ring-0" />
	<div class="min-w-0">
		<p class="truncate text-base font-semibold">{workspaceName}</p>
	</div>
</div>
