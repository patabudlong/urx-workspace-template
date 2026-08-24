<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import WorkspaceLogoCropDialog from '$lib/components/onboarding/workspace-logo-crop-dialog.svelte';
	import {
		isPayrollEmployeePhotoCropSupported,
		PAYROLL_EMPLOYEE_PHOTO_ACCEPT,
		PAYROLL_EMPLOYEE_PHOTO_MAX_BYTES
	} from '$lib/shared/payroll/employee-photo';
	import { cn } from '$lib/utils.js';
	import ImageIcon from '@lucide/svelte/icons/image';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import XIcon from '@lucide/svelte/icons/x';

	const MAX_SIZE_MB = PAYROLL_EMPLOYEE_PHOTO_MAX_BYTES / (1024 * 1024);

	let {
		id = 'payroll-employee-photo',
		previewUrl = null,
		fileName = null,
		onchange,
		onclear,
		onerror,
		class: className
	}: {
		id?: string;
		previewUrl?: string | null;
		fileName?: string | null;
		onchange?: (file: File | null) => void;
		onclear?: () => void;
		onerror?: (message: string) => void;
		class?: string;
	} = $props();

	let inputEl = $state<HTMLInputElement | null>(null);
	let isDragActive = $state(false);
	let cropOpen = $state(false);
	let pendingFile = $state<File | null>(null);

	function openPicker() {
		inputEl?.click();
	}

	function validateFile(file: File): boolean {
		if (!file.type.startsWith('image/')) {
			onerror?.('Upload a PNG, JPG, or WebP photo up to 2 MB.');
			return false;
		}

		if (!PAYROLL_EMPLOYEE_PHOTO_ACCEPT.split(',').includes(file.type)) {
			onerror?.('Upload a PNG, JPG, or WebP photo up to 2 MB.');
			return false;
		}

		if (file.size > PAYROLL_EMPLOYEE_PHOTO_MAX_BYTES) {
			onerror?.('Photo must be 2 MB or smaller.');
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

		if (isPayrollEmployeePhotoCropSupported(file.type)) {
			pendingFile = file;
			cropOpen = true;
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
		queueFile(file);
	}

	function handleCropConfirm(file: File) {
		pendingFile = null;
		onchange?.(file);
	}

	function handleCropCancel() {
		pendingFile = null;
	}
</script>

<div class={cn('grid gap-3', className)}>
	<input
		bind:this={inputEl}
		{id}
		type="file"
		accept={PAYROLL_EMPLOYEE_PHOTO_ACCEPT}
		class="sr-only"
		onchange={handleChange}
	/>

	{#if previewUrl}
		<div class="bg-muted/30 flex items-center gap-4 rounded-xl p-4">
			<img
				src={previewUrl}
				alt="Employee preview"
				class="bg-background size-20 rounded-full border object-cover"
			/>
			<div class="min-w-0 flex-1">
				<p class="text-foreground truncate text-sm font-medium">{fileName ?? 'Photo selected'}</p>
				<p class="text-muted-foreground mt-0.5 text-xs">Shown on employee records in payroll.</p>
			</div>
			<div class="flex items-center gap-1">
				<Button type="button" variant="outline" size="sm" onclick={openPicker}>Replace</Button>
				<Button type="button" variant="ghost" size="icon-sm" aria-label="Remove photo" onclick={onclear}>
					<XIcon class="size-4" />
				</Button>
			</div>
		</div>
	{:else}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			role="group"
			aria-label="Upload employee photo"
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
				<ImageIcon class="size-6" />
			</span>
			<span>
				<span class="text-foreground block text-sm font-semibold">Upload employee photo</span>
				<span class="text-muted-foreground mt-1 block text-xs">
					Drag and drop or choose a file · PNG, JPG, or WebP · up to {MAX_SIZE_MB} MB
				</span>
			</span>
			<Button type="button" variant="outline" size="sm" onclick={openPicker}>
				<UploadIcon class="size-4" />
				Choose file
			</Button>
		</div>
	{/if}
</div>

<WorkspaceLogoCropDialog
	bind:open={cropOpen}
	file={pendingFile}
	title="Crop employee photo"
	description="Drag to reposition and zoom so the face fits the circle."
	cropFileName="employee-photo.png"
	previewAlt="Employee photo crop preview"
	onconfirm={handleCropConfirm}
	oncancel={handleCropCancel}
/>
