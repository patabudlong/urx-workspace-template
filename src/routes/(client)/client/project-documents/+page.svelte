<script lang="ts">
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { PM_DOCUMENT_CHECKLIST_STATUSES } from '$lib/shared/models/pm-document-checklist-item';
	import {
		PM_DOCUMENT_UPLOAD_INVALID_LINK_MESSAGE,
		PM_DOCUMENT_UPLOAD_SUBMITTED_MESSAGE
	} from '$lib/shared/project-management/messages';
	import { PM_PROJECT_FILE_ACCEPT } from '$lib/shared/project-management/project-files';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data, form } = $props();

	let uploadingItemId = $state<string | null>(null);

	const statusLabels: Record<string, string> = {
		[PM_DOCUMENT_CHECKLIST_STATUSES.PENDING]: 'Pending',
		[PM_DOCUMENT_CHECKLIST_STATUSES.SUBMITTED]: 'Submitted',
		[PM_DOCUMENT_CHECKLIST_STATUSES.APPROVED]: 'Approved',
		[PM_DOCUMENT_CHECKLIST_STATUSES.REJECTED]: 'Needs update'
	};

	const uploadMessage = $derived(form?.message ?? null);
	const uploadSuccess = $derived(uploadMessage === PM_DOCUMENT_UPLOAD_SUBMITTED_MESSAGE);

	function formatDateTime(value: string): string {
		return new Intl.DateTimeFormat(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	}
</script>

<div class="flex flex-col gap-8">
	<div class="space-y-2 text-center">
		<h1 class="text-2xl font-semibold tracking-tight">Project documents</h1>
		{#if data.preview}
			<p class="text-muted-foreground text-sm">
				{data.preview.workspaceName} · {data.preview.projectTitle}
			</p>
			<p class="text-muted-foreground text-xs">
				Link expires {formatDateTime(data.preview.expiresAt)}
			</p>
		{/if}
	</div>

	{#if !data.preview}
		<StatusAlert
			variant="danger"
			title="Invalid link"
			description={PM_DOCUMENT_UPLOAD_INVALID_LINK_MESSAGE}
		/>
	{:else}
		{#if uploadSuccess}
			<StatusAlert
				variant="success"
				title="Upload received"
				description={PM_DOCUMENT_UPLOAD_SUBMITTED_MESSAGE}
			/>
		{:else if uploadMessage}
			<StatusAlert variant="danger" title="Upload failed" description={uploadMessage} />
		{/if}

		<Card.Root>
			<Card.Header>
				<Card.Title>Requested documents</Card.Title>
				<Card.Description>
					Upload each file below. You can replace a file by uploading again if we request changes.
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				{#each data.preview.items as item (item.id)}
					<div class="rounded-lg border p-4">
						<div class="mb-3 flex flex-wrap items-center gap-2">
							<p class="font-medium">{item.title}</p>
							{#if item.required}
								<Badge variant="outline">Required</Badge>
							{/if}
							<Badge variant="secondary">{statusLabels[item.status]}</Badge>
						</div>
						{#if item.description}
							<p class="text-muted-foreground mb-3 text-sm">{item.description}</p>
						{/if}

						{#if item.status === PM_DOCUMENT_CHECKLIST_STATUSES.APPROVED}
							<p class="text-muted-foreground text-sm">This item has been approved. No further upload needed.</p>
						{:else}
							<form
								method="POST"
								action="?/upload"
								enctype="multipart/form-data"
								onsubmit={() => {
									uploadingItemId = item.id;
								}}
								use:enhance={() => {
									return async ({ result, update }) => {
										uploadingItemId = null;
										await update();
										if (result.type === 'success') {
											await invalidateAll();
										}
									};
								}}
								class="space-y-3"
							>
								<input type="hidden" name="checklistItemId" value={item.id} />
								<div class="space-y-2">
									<Label for="file-{item.id}">Choose file</Label>
									<input
										id="file-{item.id}"
										name="file"
										type="file"
										accept={PM_PROJECT_FILE_ACCEPT}
										required
										class="border-input bg-background file:text-foreground flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
									/>
								</div>
								<Button type="submit" disabled={uploadingItemId === item.id}>
									{uploadingItemId === item.id ? 'Uploading…' : 'Upload file'}
								</Button>
							</form>
						{/if}
					</div>
				{/each}
			</Card.Content>
		</Card.Root>
	{/if}
</div>
