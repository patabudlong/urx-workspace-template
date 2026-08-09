<script lang="ts">
	import MailboxMessageView from '$lib/components/mailbox/mailbox-message-view.svelte';
	import MailboxMessageViewSkeleton from '$lib/components/mailbox/mailbox-message-view-skeleton.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { encodeMailboxFolder } from '$lib/mailbox/utils';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

	let { data } = $props();
</script>

{#await data.message}
	<MailboxMessageViewSkeleton />
{:then message}
	<div class="flex min-h-0 flex-col gap-4">
		<div>
			<Button
				variant="ghost"
				size="sm"
				href={`/mailbox/${encodeMailboxFolder(data.folder)}`}
				class="h-9 px-2"
			>
				<ArrowLeftIcon class="size-4" aria-hidden="true" />
				Back to folder
			</Button>
		</div>

		<MailboxMessageView {message} />
	</div>
{/await}
