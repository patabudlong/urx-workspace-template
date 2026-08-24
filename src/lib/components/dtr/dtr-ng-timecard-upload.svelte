<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		NG_TIMECARD_ACCEPT,
		NG_TIMECARD_MAX_BYTES
	} from '$lib/shared/dtr/ng-timecard-import';
	import { cn } from '$lib/utils.js';
	import FileSpreadsheetIcon from '@lucide/svelte/icons/file-spreadsheet';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import XIcon from '@lucide/svelte/icons/x';

	const MAX_SIZE_MB = NG_TIMECARD_MAX_BYTES / (1024 * 1024);

	let {
		id = 'dtr-ng-timecard-file',
		fileName = null,
		onchange,
		onclear,
		onerror,
		class: className
	}: {
		id?: string;
		fileName?: string | null;
		onchange?: (file: File | null) => void;
		onclear?: () => void;
		onerror?: (message: string) => void;
		class?: string;
	} = $props();

	let inputEl = $state<HTMLInputElement | null>(null);
	let isDragActive = $state(false);

	function openPicker() {
		inputEl?.click();
	}

	function validateFile(file: File): boolean {
		const extension = file.name.split('.').pop()?.toLowerCase();

		if (extension !== 'xls' && extension !== 'xlsx') {
			onerror?.('Upload an NG timecard export (.xls or .xlsx) up to 5 MB.');
			return false;
		}

		if (file.size > NG_TIMECARD_MAX_BYTES) {
			onerror?.('Timecard file must be 5 MB or smaller.');
			return false;
		}

		return true;
	}

	function queueFile(file: File | null) {
		if (!file) {
			return;
		}

		if (!validateFile(file)) {
			return;
		}

		onchange?.(file);
	}

	function handleChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;
		queueFile(file);
		input.value = '';
	}

	function handleDragEnter(event: DragEvent) {
		event.preventDefault();
		isDragActive = true;
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragActive = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();

		const related = event.relatedTarget as Node | null;
		if (related && (event.currentTarget as HTMLElement).contains(related)) {
			return;
		}

		isDragActive = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragActive = false;

		const file = event.dataTransfer?.files?.[0] ?? null;

		if (file && inputEl) {
			const dataTransfer = new DataTransfer();
			dataTransfer.items.add(file);
			inputEl.files = dataTransfer.files;
		}

		queueFile(file);
	}
</script>

<div class={cn('grid gap-3', className)}>
	<input
		bind:this={inputEl}
		{id}
		name="timecardFile"
		type="file"
		accept={NG_TIMECARD_ACCEPT}
		class="sr-only"
		onchange={handleChange}
	/>

	{#if fileName}
		<div class="bg-muted/30 flex items-center gap-4 rounded-xl p-4">
			<span
				class="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-full"
				aria-hidden="true"
			>
				<FileSpreadsheetIcon class="size-6" />
			</span>
			<div class="min-w-0 flex-1">
				<p class="text-foreground truncate text-sm font-medium">{fileName}</p>
				<p class="text-muted-foreground mt-0.5 text-xs">NG biometric timecard export.</p>
			</div>
			<div class="flex items-center gap-1">
				<Button type="button" variant="outline" size="sm" onclick={openPicker}>Replace</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label="Remove file"
					onclick={onclear}
				>
					<XIcon class="size-4" />
				</Button>
			</div>
		</div>
	{:else}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			role="group"
			aria-label="Upload timecard file"
			class={cn(
				'border-border bg-muted/20 flex w-full flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-8 text-center transition-colors',
				isDragActive && 'border-primary bg-primary/5'
			)}
			ondragenter={handleDragEnter}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
		>
			<span
				class="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full"
				aria-hidden="true"
			>
				<FileSpreadsheetIcon class="size-6" />
			</span>
			<span>
				<span class="text-foreground block text-sm font-semibold">Upload NG timecard</span>
				<span class="text-muted-foreground mt-1 block text-xs">
					Drag and drop or choose a file · .xls or .xlsx · up to {MAX_SIZE_MB} MB
				</span>
			</span>
			<Button type="button" variant="outline" size="sm" onclick={openPicker}>
				<UploadIcon class="size-4" />
				Choose file
			</Button>
		</div>
	{/if}
</div>
