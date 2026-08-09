<script lang="ts">
	import MailboxMessageList from '$lib/components/mailbox/mailbox-message-list.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { MailboxFolder } from '$lib/shared/mailbox/schemas';
	import { getMailboxFolderLabel } from '$lib/mailbox/utils';
	import { page } from '$app/state';

	let { data } = $props();

	const folderLabel = $derived.by(() => {
		const folders = page.data.folders as MailboxFolder[] | undefined;
		const match = folders?.find((folder: MailboxFolder) => folder.path === data.folder);
		return match ? getMailboxFolderLabel(match) : data.folder;
	});
</script>

<Card.Root class="min-h-0 flex-1">
	<Card.Header class="flex-row items-center justify-between gap-4 space-y-0">
		<div>
			<Card.Title>{folderLabel}</Card.Title>
			<Card.Description>
				{data.pagination.total === 1
					? '1 message'
					: `${data.pagination.total} messages`}
			</Card.Description>
		</div>
		<div class="flex items-center gap-2">
			{#if data.pagination.page > 1}
				<Button
					variant="outline"
					size="sm"
					href={`/mailbox/${page.params.folder}?page=${data.pagination.page - 1}`}
				>
					Previous
				</Button>
			{/if}
			{#if data.pagination.hasMore}
				<Button
					variant="outline"
					size="sm"
					href={`/mailbox/${page.params.folder}?page=${data.pagination.page + 1}`}
				>
					Next
				</Button>
			{/if}
		</div>
	</Card.Header>
	<Card.Content class="p-0">
		<MailboxMessageList folder={data.folder} messages={data.messages} />
	</Card.Content>
</Card.Root>
