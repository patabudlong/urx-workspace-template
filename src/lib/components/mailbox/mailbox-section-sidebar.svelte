<script lang="ts">
	import {
		encodeMailboxFolder,
		getMailboxFolderIcon,
		getMailboxFolderLabel
	} from '$lib/mailbox/utils';
	import type { MailboxFolder } from '$lib/shared/mailbox/schemas';
	import { cn } from '$lib/utils.js';

	let {
		folders,
		activeFolder
	}: {
		folders: MailboxFolder[];
		activeFolder: string;
	} = $props();
</script>

<aside class="border-border bg-muted/30 shrink-0 border-b" aria-label="Mailbox navigation">
	<div class="px-4 pt-4 pb-2">
		<h2 class="text-sm font-semibold">Mailbox</h2>
		<p class="text-muted-foreground mt-1 text-xs leading-relaxed">
			Browse folders and read messages from your connected PrivateEmail account.
		</p>
	</div>

	<nav class="flex gap-1 overflow-x-auto p-2">
		{#each folders as folder (folder.path)}
			{@const Icon = getMailboxFolderIcon(folder)}
			{@const href = `/mailbox/${encodeMailboxFolder(folder.path)}`}
			{@const active = activeFolder === folder.path}
			<a
				{href}
				class={cn(
					'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
					active
						? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
						: 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
				)}
				aria-current={active ? 'page' : undefined}
			>
				<Icon class="size-4 shrink-0" />
				<span>{getMailboxFolderLabel(folder)}</span>
				{#if folder.unseen > 0}
					<span class="text-primary text-xs font-medium">{folder.unseen}</span>
				{/if}
			</a>
		{/each}
	</nav>
</aside>
