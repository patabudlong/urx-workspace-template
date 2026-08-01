<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import {
		createDefaultCropTransform,
		cropImageToSquareFile,
		getCropBaseScale,
		loadImageElement,
		type ImageCropTransform
	} from '$lib/shared/image-crop';
	import { WORKSPACE_LOGO_CROP_VIEWPORT_SIZE } from '$lib/shared/workspace-branding';
	import { cn } from '$lib/utils.js';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';

	let {
		open = $bindable(false),
		file = null,
		onconfirm,
		oncancel
	}: {
		open?: boolean;
		file?: File | null;
		onconfirm?: (file: File) => void;
		oncancel?: () => void;
	} = $props();

	const viewportSize = WORKSPACE_LOGO_CROP_VIEWPORT_SIZE;

	let image = $state<HTMLImageElement | null>(null);
	let transform = $state<ImageCropTransform>(createDefaultCropTransform());
	let isApplying = $state(false);
	let isDragging = $state(false);
	let dragStart = $state({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
	let loadError = $state('');

	const baseScale = $derived(
		image ? getCropBaseScale(image.naturalWidth, image.naturalHeight, viewportSize) : 1
	);
	const displayScale = $derived(baseScale * transform.scale);
	const displayWidth = $derived(image ? image.naturalWidth * displayScale : 0);
	const displayHeight = $derived(image ? image.naturalHeight * displayScale : 0);
	const imageLeft = $derived((viewportSize - displayWidth) / 2 + transform.offsetX);
	const imageTop = $derived((viewportSize - displayHeight) / 2 + transform.offsetY);

	$effect(() => {
		if (!open || !file) {
			image = null;
			transform = createDefaultCropTransform();
			loadError = '';
			return;
		}

		let cancelled = false;

		void (async () => {
			try {
				const loaded = await loadImageElement(file);
				if (!cancelled) {
					image = loaded;
					transform = createDefaultCropTransform();
					loadError = '';
				}
			} catch {
				if (!cancelled) {
					image = null;
					loadError = 'Unable to load this image. Try a different file.';
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	});

	function clampOffset(next: ImageCropTransform): ImageCropTransform {
		if (!image) {
			return next;
		}

		const width = image.naturalWidth * baseScale * next.scale;
		const height = image.naturalHeight * baseScale * next.scale;
		const maxOffsetX = Math.max(0, (width - viewportSize) / 2);
		const maxOffsetY = Math.max(0, (height - viewportSize) / 2);

		return {
			scale: next.scale,
			offsetX: Math.min(maxOffsetX, Math.max(-maxOffsetX, next.offsetX)),
			offsetY: Math.min(maxOffsetY, Math.max(-maxOffsetY, next.offsetY))
		};
	}

	function handlePointerDown(event: PointerEvent) {
		if (!image) {
			return;
		}

		isDragging = true;
		dragStart = {
			x: event.clientX,
			y: event.clientY,
			offsetX: transform.offsetX,
			offsetY: transform.offsetY
		};
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!isDragging) {
			return;
		}

		transform = clampOffset({
			...transform,
			offsetX: dragStart.offsetX + (event.clientX - dragStart.x),
			offsetY: dragStart.offsetY + (event.clientY - dragStart.y)
		});
	}

	function handlePointerUp(event: PointerEvent) {
		isDragging = false;
		(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
	}

	function handleZoomInput(event: Event) {
		const value = Number((event.currentTarget as HTMLInputElement).value);
		transform = clampOffset({
			...transform,
			scale: value
		});
	}

	function closeDialog() {
		open = false;
		oncancel?.();
	}

	async function applyCrop() {
		if (!image || !file) {
			return;
		}

		isApplying = true;

		try {
			const cropped = await cropImageToSquareFile(image, transform, {
				fileName: file.name.replace(/\.[^.]+$/, '.png') || 'workspace-logo.png'
			});
			onconfirm?.(cropped);
			open = false;
		} catch {
			loadError = 'Unable to crop this image. Try a different file.';
		} finally {
			isApplying = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="gap-0 overflow-hidden p-0 sm:max-w-md" showCloseButton={false}>
		<div class="space-y-5 p-6">
			<Dialog.Header class="space-y-1 text-left">
				<Dialog.Title>Crop your logo</Dialog.Title>
				<Dialog.Description>
					Drag to reposition and zoom so your logo fits the square frame.
				</Dialog.Description>
			</Dialog.Header>

			<div
				class="bg-muted/40 relative mx-auto overflow-hidden rounded-xl border"
				style:width="{viewportSize}px"
				style:height="{viewportSize}px"
			>
				{#if image}
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<img
						src={image.src}
						alt="Logo crop preview"
						class={cn(
							'absolute max-w-none touch-none select-none',
							isDragging ? 'cursor-grabbing' : 'cursor-grab'
						)}
						style:width="{displayWidth}px"
						style:height="{displayHeight}px"
						style:left="{imageLeft}px"
						style:top="{imageTop}px"
						draggable="false"
						onpointerdown={handlePointerDown}
						onpointermove={handlePointerMove}
						onpointerup={handlePointerUp}
						onpointercancel={handlePointerUp}
					/>
					<div
						class="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-white/80 ring-inset"
						aria-hidden="true"
					></div>
				{:else if loadError}
					<p class="text-muted-foreground flex h-full items-center justify-center px-6 text-center text-sm">
						{loadError}
					</p>
				{:else}
					<div class="flex h-full items-center justify-center">
						<Loader2Icon class="text-muted-foreground size-6 animate-spin" />
					</div>
				{/if}
			</div>

			<div class="grid gap-2">
				<div class="flex items-center justify-between gap-3">
					<label class="text-sm font-medium" for="logo-crop-zoom">Zoom</label>
					<span class="text-muted-foreground text-xs">{transform.scale.toFixed(1)}x</span>
				</div>
				<input
					id="logo-crop-zoom"
					type="range"
					min="1"
					max="3"
					step="0.05"
					value={transform.scale}
					class="accent-primary w-full"
					disabled={!image}
					oninput={handleZoomInput}
				/>
			</div>

			{#if loadError && image}
				<p class="text-destructive m-0 text-sm">{loadError}</p>
			{/if}

			<div class="flex items-center justify-end gap-2">
				<Button type="button" variant="outline" disabled={isApplying} onclick={closeDialog}>
					Cancel
				</Button>
				<Button type="button" disabled={!image || isApplying} onclick={applyCrop}>
					{#if isApplying}
						<Loader2Icon class="size-4 animate-spin" />
					{/if}
					Apply crop
				</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
