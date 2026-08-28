<script lang="ts">
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import type { PmDocumentChecklistItemDto } from '$lib/shared/models/pm-document-checklist-item';
	import { PM_DOCUMENT_CHECKLIST_STATUSES } from '$lib/shared/models/pm-document-checklist-item';
	import {
		PM_DOCUMENT_CHECKLIST_ITEM_ADDED_MESSAGE,
		PM_DOCUMENT_CHECKLIST_ITEM_REMOVED_MESSAGE,
		PM_DOCUMENT_CHECKLIST_ITEM_REVIEWED_MESSAGE
	} from '$lib/shared/project-management/messages';
	import { pmDocumentChecklistItemFormSchema } from '$lib/shared/project-management/schemas';
	import { formatPmProjectFileSize } from '$lib/shared/project-management/project-files';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';

	let {
		projectId,
		items,
		checklistForm,
		filesByItem = {}
	}: {
		projectId: string;
		items: PmDocumentChecklistItemDto[];
		checklistForm: import('sveltekit-superforms').SuperValidated<
			import('$lib/shared/project-management/schemas').PmDocumentChecklistItemFormInput
		>;
		filesByItem?: Record<string, Array<{ id: string; originalFilename: string; sizeBytes: number }>>;
	} = $props();

	let adding = $state(false);
	let reviewingItemId = $state<string | null>(null);
	let removingItemId = $state<string | null>(null);

	const statusLabels: Record<string, string> = {
		[PM_DOCUMENT_CHECKLIST_STATUSES.PENDING]: 'Pending',
		[PM_DOCUMENT_CHECKLIST_STATUSES.SUBMITTED]: 'Submitted',
		[PM_DOCUMENT_CHECKLIST_STATUSES.APPROVED]: 'Approved',
		[PM_DOCUMENT_CHECKLIST_STATUSES.REJECTED]: 'Rejected'
	};

	const statusVariant = (status: string) => {
		if (status === PM_DOCUMENT_CHECKLIST_STATUSES.APPROVED) return 'default';
		if (status === PM_DOCUMENT_CHECKLIST_STATUSES.SUBMITTED) return 'secondary';
		if (status === PM_DOCUMENT_CHECKLIST_STATUSES.REJECTED) return 'destructive';
		return 'outline';
	};

	const checklistSuperform = superForm(untrack(() => checklistForm), {
		validators: zod4Client(pmDocumentChecklistItemFormSchema),
		resetForm: true,
		onSubmit: () => {
			adding = true;
		},
		onUpdated: async ({ form }) => {
			adding = false;
			if (form.message === PM_DOCUMENT_CHECKLIST_ITEM_ADDED_MESSAGE) {
				toast.success('Checklist item added', {
					description: PM_DOCUMENT_CHECKLIST_ITEM_ADDED_MESSAGE
				});
				await invalidateAll();
			}
		},
		onError: () => {
			adding = false;
		}
	});

	const { enhance: enhanceAdd, form: addForm, message: addMessage } = checklistSuperform;
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Document checklist</Card.Title>
		<Card.Description>
			Request files from your client. Default items are added when you send a document portal invite.
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-6">
		{#if typeof $addMessage === 'string' && $addMessage.length > 0 && $addMessage !== PM_DOCUMENT_CHECKLIST_ITEM_ADDED_MESSAGE}
			<StatusAlert variant="danger" title="Could not add item" description={$addMessage} />
		{/if}

		{#if items.length === 0}
			<p class="text-muted-foreground text-sm">
				No checklist items yet. Add items below or send a document portal invite to load the default
				set.
			</p>
		{:else}
			<div class="space-y-3">
				{#each items as item (item.id)}
					<div class="rounded-lg border p-4">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div class="space-y-1">
								<div class="flex flex-wrap items-center gap-2">
									<p class="font-medium">{item.title}</p>
									{#if item.required}
										<Badge variant="outline">Required</Badge>
									{/if}
									<Badge variant={statusVariant(item.status)}>
										{statusLabels[item.status]}
									</Badge>
								</div>
								{#if item.description}
									<p class="text-muted-foreground text-sm">{item.description}</p>
								{/if}
							</div>
							<form
								method="POST"
								action="?/removeChecklistItem"
								onsubmit={() => {
									removingItemId = item.id;
								}}
								use:enhance={() => {
									return async ({ result }) => {
										removingItemId = null;
										if (result.type === 'success') {
											toast.success('Checklist item removed', {
												description: PM_DOCUMENT_CHECKLIST_ITEM_REMOVED_MESSAGE
											});
											await invalidateAll();
										}
									};
								}}
							>
								<input type="hidden" name="itemId" value={item.id} />
								<Button
									type="submit"
									variant="ghost"
									size="sm"
									class="text-destructive"
									disabled={removingItemId === item.id}
								>
									{removingItemId === item.id ? 'Removing…' : 'Remove'}
								</Button>
							</form>
						</div>

						{#if filesByItem[item.id]?.length}
							<div class="mt-3 space-y-2">
								<p class="text-muted-foreground text-xs font-medium uppercase tracking-wide">
									Uploaded files
								</p>
								{#each filesByItem[item.id] as file (file.id)}
									<div class="flex flex-wrap items-center justify-between gap-2 text-sm">
										<span>{file.originalFilename}</span>
										<div class="flex items-center gap-3">
											<span class="text-muted-foreground">
												{formatPmProjectFileSize(file.sizeBytes)}
											</span>
											<a
												class="text-primary hover:underline"
												href="/api/v1/project-management/projects/{projectId}/files/{file.id}"
											>
												Download
											</a>
										</div>
									</div>
								{/each}
							</div>
						{/if}

						{#if item.status === PM_DOCUMENT_CHECKLIST_STATUSES.SUBMITTED}
							<div class="mt-4 flex flex-wrap gap-2">
								<form
									method="POST"
									action="?/reviewChecklistItem"
									onsubmit={() => {
										reviewingItemId = item.id;
									}}
									use:enhance={() => {
										return async ({ result }) => {
											reviewingItemId = null;
											if (result.type === 'success') {
												toast.success('Checklist item updated', {
													description: PM_DOCUMENT_CHECKLIST_ITEM_REVIEWED_MESSAGE
												});
												await invalidateAll();
											}
										};
									}}
								>
									<input type="hidden" name="itemId" value={item.id} />
									<input
										type="hidden"
										name="status"
										value={PM_DOCUMENT_CHECKLIST_STATUSES.APPROVED}
									/>
									<Button type="submit" size="sm" disabled={reviewingItemId === item.id}>
										Approve
									</Button>
								</form>
								<form
									method="POST"
									action="?/reviewChecklistItem"
									onsubmit={() => {
										reviewingItemId = item.id;
									}}
									use:enhance={() => {
										return async ({ result }) => {
											reviewingItemId = null;
											if (result.type === 'success') {
												toast.success('Checklist item updated', {
													description: PM_DOCUMENT_CHECKLIST_ITEM_REVIEWED_MESSAGE
												});
												await invalidateAll();
											}
										};
									}}
								>
									<input type="hidden" name="itemId" value={item.id} />
									<input
										type="hidden"
										name="status"
										value={PM_DOCUMENT_CHECKLIST_STATUSES.REJECTED}
									/>
									<Button
										type="submit"
										size="sm"
										variant="outline"
										disabled={reviewingItemId === item.id}
									>
										Request changes
									</Button>
								</form>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<form method="POST" action="?/addChecklistItem" use:enhanceAdd class="space-y-4 border-t pt-4">
			<p class="text-sm font-medium">Add checklist item</p>
			<div class="space-y-2">
				<Label for="checklist-title">Title</Label>
				<Input id="checklist-title" name="title" bind:value={$addForm.title} />
			</div>
			<div class="space-y-2">
				<Label for="checklist-description">Description (optional)</Label>
				<Textarea
					id="checklist-description"
					name="description"
					rows={2}
					bind:value={$addForm.description}
				/>
			</div>
			<label class="flex items-center gap-2 text-sm">
				<input type="checkbox" name="required" bind:checked={$addForm.required} />
				Required item
			</label>
			<Button type="submit" disabled={adding}>
				{adding ? 'Adding…' : 'Add item'}
			</Button>
		</form>
	</Card.Content>
</Card.Root>
