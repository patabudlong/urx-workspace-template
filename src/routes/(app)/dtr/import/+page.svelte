<script lang="ts">
	import DtrNgTimecardUpload from '$lib/components/dtr/dtr-ng-timecard-upload.svelte';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { DTR_DAY_STATUS_LABELS } from '$lib/shared/dtr/status';
	import {
		DTR_NG_IMPORT_PREVIEW_READY_MESSAGE,
		DTR_NG_IMPORT_SUCCESS_MESSAGE
	} from '$lib/shared/dtr/messages';
	import {
		formatDtrNgImportTimeRange,
		type DtrNgImportPreview
	} from '$lib/shared/dtr/ng-timecard-import';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data, form } = $props();

	let selectedFileName = $state<string | null>(null);
	let uploadError = $state<string | null>(null);
	let markAbsentOnEmpty = $state(false);
	let previewSubmitting = $state(false);
	let importSubmitting = $state(false);
	let clearSubmitting = $state(false);

	const preview = $derived(
		(form?.preview as DtrNgImportPreview | null | undefined) ?? data.preview
	);

	const warnings = $derived(preview?.warnings ?? []);

	const showPreviewSuccess = $derived(
		form?.success === true &&
			form?.message === DTR_NG_IMPORT_PREVIEW_READY_MESSAGE &&
			preview !== null
	);

	const showImportSuccess = $derived(
		form?.success === true && form?.message === DTR_NG_IMPORT_SUCCESS_MESSAGE
	);

	const formError = $derived(
		typeof form?.message === 'string' &&
			form.message.length > 0 &&
			form.message !== DTR_NG_IMPORT_PREVIEW_READY_MESSAGE &&
			form.message !== DTR_NG_IMPORT_SUCCESS_MESSAGE
	);

	function clearSelectedFile() {
		selectedFileName = null;
		uploadError = null;
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="DTR"
		title="Upload timecard"
		description="Import NG biometric timecard exports (.xls) into daily time records. Employees are matched by payroll employee code."
	/>

	{#if uploadError}
		<StatusAlert variant="danger" title="Invalid file" description={uploadError} />
	{:else if formError}
		<StatusAlert
			variant="danger"
			title="Upload failed"
			description={typeof form?.message === 'string' ? form.message : 'Could not process the file.'}
		/>
	{:else if showImportSuccess}
		<StatusAlert
			variant="success"
			title="Timecard imported"
			description={typeof form?.imported === 'number'
				? `${form.imported} daily records were saved with biometric source.`
				: DTR_NG_IMPORT_SUCCESS_MESSAGE}
		/>
	{:else if showPreviewSuccess}
		<StatusAlert
			variant="info"
			title="Preview ready"
			description={DTR_NG_IMPORT_PREVIEW_READY_MESSAGE}
		/>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>Upload file</Card.Title>
			<Card.Description>
				Export a timecard report from your NG biometric system, then upload it here. Set each
				employee&apos;s <span class="font-medium">employee code</span> in Payroll to match the ID in
				the file (for example <span class="font-medium">810260001</span>).
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-6">
			<form
				method="POST"
				action="?/preview"
				enctype="multipart/form-data"
				class="space-y-5"
				use:enhance={() => {
					previewSubmitting = true;
					uploadError = null;

					return async ({ update, result }) => {
						previewSubmitting = false;
						await update();

						if (result.type === 'success') {
							selectedFileName = null;
						}
					};
				}}
			>
				<DtrNgTimecardUpload
					fileName={selectedFileName}
					onchange={(file) => {
						selectedFileName = file?.name ?? null;
						uploadError = null;
					}}
					onclear={clearSelectedFile}
					onerror={(message) => {
						uploadError = message;
						selectedFileName = null;
					}}
				/>

				<div class="flex items-start gap-3">
					<Checkbox id="mark-absent" bind:checked={markAbsentOnEmpty} />
					<div class="grid gap-1">
						<Label for="mark-absent" class="text-sm font-medium leading-none">
							Mark empty work days as absent
						</Label>
						<p class="text-muted-foreground text-xs">
							When unchecked, days with no punches are skipped (rest days are always skipped).
						</p>
					</div>
				</div>

				{#if markAbsentOnEmpty}
					<input type="hidden" name="markAbsent" value="true" />
				{/if}

				<Button
					type="submit"
					class="h-10"
					disabled={previewSubmitting || !selectedFileName}
				>
					{#if previewSubmitting}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Previewing…
					{:else}
						Preview import
					{/if}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>

	{#if preview}
		<Card.Root>
			<Card.Header>
				<Card.Title>Import preview</Card.Title>
				<Card.Description>
					Pay period {preview.payPeriodStart} to {preview.payPeriodEnd} ·
					{preview.rows.length} rows to import · {preview.skippedCount} skipped
				</Card.Description>
				{#if preview}
					<Card.Action>
						<form
							method="POST"
							action="?/clear"
							use:enhance={() => {
								clearSubmitting = true;

								return async ({ update }) => {
									clearSubmitting = false;
									await update();
									await invalidateAll();
								};
							}}
						>
							<Button
								type="submit"
								variant="outline"
								class="h-10"
								disabled={clearSubmitting || importSubmitting}
							>
								{#if clearSubmitting}
									<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
									Clearing…
								{:else}
									Clear preview
								{/if}
							</Button>
						</form>
					</Card.Action>
				{/if}
			</Card.Header>
			<Card.Content class="space-y-6">
				{#if warnings.length > 0}
					<StatusAlert
						variant="warning"
						title="Review warnings"
						description={warnings.join(' ')}
					/>
				{/if}

				<div class="overflow-x-auto rounded-lg border">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Date</Table.Head>
								<Table.Head>Employee</Table.Head>
								<Table.Head>Code</Table.Head>
								<Table.Head>Status</Table.Head>
								<Table.Head>Times</Table.Head>
								<Table.Head>Note</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each preview.rows as row (`${row.employeeId}-${row.date}`)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.date}</Table.Cell>
									<Table.Cell>{row.employeeName}</Table.Cell>
									<Table.Cell>{row.employeeCode}</Table.Cell>
									<Table.Cell>{DTR_DAY_STATUS_LABELS[row.status]}</Table.Cell>
									<Table.Cell>
										{formatDtrNgImportTimeRange(row.timeIn, row.timeOut)}
									</Table.Cell>
									<Table.Cell class="text-muted-foreground max-w-48 truncate">
										{row.notes ?? '—'}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>

				<form
					method="POST"
					action="?/import"
					use:enhance={() => {
						importSubmitting = true;

						return async ({ update }) => {
							importSubmitting = false;
							await update();
							await invalidateAll();
						};
					}}
				>
					<Button type="submit" class="h-10" disabled={importSubmitting || clearSubmitting}>
						{#if importSubmitting}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							Importing…
						{:else}
							Import {preview.rows.length} records
						{/if}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
