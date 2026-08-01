<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import ImageIcon from '@lucide/svelte/icons/image';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import XIcon from '@lucide/svelte/icons/x';

	const ACCEPTED_TYPES = 'image/png,image/jpeg,image/webp,image/svg+xml';
	const MAX_SIZE_MB = 2;

	let {
		id = 'workspace-brand-logo',
		previewUrl = null,
		fileName = null,
		onchange,
		onclear,
		class: className
	}: {
		id?: string;
		previewUrl?: string | null;
		fileName?: string | null;
		onchange?: (file: File | null) => void;
		onclear?: () => void;
		class?: string;
	} = $props();

	let inputEl = $state<HTMLInputElement | null>(null);

	function openPicker() {
		inputEl?.click();
	}

	function handleChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;
		onchange?.(file);
		input.value = '';
	}
</script>

<div class={cn('grid gap-3', className)}>
	<input
		bind:this={inputEl}
		{id}
		type="file"
		accept={ACCEPTED_TYPES}
		class="sr-only"
		onchange={handleChange}
	/>

	{#if previewUrl}
		<div class="bg-muted/30 flex items-center gap-4 rounded-xl p-4">
			<img
				src={previewUrl}
				alt="Company logo preview"
				class="bg-background size-20 rounded-lg border object-contain p-2"
			/>
			<div class="min-w-0 flex-1">
				<p class="text-foreground truncate text-sm font-medium">{fileName ?? 'Logo selected'}</p>
				<p class="text-muted-foreground mt-0.5 text-xs">This will appear on your workspace.</p>
			</div>
			<Button type="button" variant="ghost" size="icon-sm" aria-label="Remove logo" onclick={onclear}>
				<XIcon class="size-4" />
			</Button>
		</div>
	{:else}
		<button
			type="button"
			class="hover:bg-muted/40 border-border bg-muted/20 flex w-full flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-8 text-center transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			onclick={openPicker}
		>
			<span
				class="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full"
				aria-hidden="true"
			>
				<ImageIcon class="size-6" />
			</span>
			<span>
				<span class="text-foreground block text-sm font-semibold">Upload company logo</span>
				<span class="text-muted-foreground mt-1 block text-xs">
					PNG, JPG, WebP, or SVG · up to {MAX_SIZE_MB} MB
				</span>
			</span>
			<span
				class="text-primary inline-flex items-center gap-1.5 text-xs font-medium"
				aria-hidden="true"
			>
				<UploadIcon class="size-3.5" />
				Choose file
			</span>
		</button>
	{/if}
</div>
