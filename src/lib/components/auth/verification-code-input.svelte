<script lang="ts">
	import { cn } from '$lib/utils.js';

	const CODE_LENGTH = 6;

	let {
		value = $bindable(''),
		name,
		disabled = false,
		id,
		'aria-invalid': ariaInvalid = undefined,
		'aria-describedby': ariaDescribedBy = undefined,
		class: className
	}: {
		value?: string;
		name?: string;
		disabled?: boolean;
		id?: string;
		'aria-invalid'?: boolean | 'true' | 'false';
		'aria-describedby'?: string;
		class?: string;
	} = $props();

	let inputEl = $state<HTMLInputElement | null>(null);
	let activeIndex = $state(0);

	const digits = $derived(
		Array.from({ length: CODE_LENGTH }, (_, index) => value[index] ?? '')
	);

	function extractDigits(text: string): string {
		const normalized = text.replace(/[\uFF10-\uFF19]/g, (character) =>
			String.fromCharCode(character.charCodeAt(0) - 0xff10 + 0x30)
		);

		return normalized.replace(/\D/g, '').slice(0, CODE_LENGTH);
	}

	function setValue(next: string) {
		value = extractDigits(next);
	}

	function syncInputElement() {
		if (inputEl && inputEl.value !== value) {
			inputEl.value = value;
		}
	}

	function updateActiveIndex() {
		if (!inputEl) {
			return;
		}

		const position = inputEl.selectionStart ?? value.length;
		activeIndex = Math.min(Math.max(position, 0), CODE_LENGTH - 1);
	}

	function focusInput(index = value.length) {
		if (!inputEl) {
			return;
		}

		inputEl.focus();
		const position = Math.min(index, value.length, CODE_LENGTH - 1);
		inputEl.setSelectionRange(position, position + 1);
		activeIndex = position;
	}

	function handleInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		setValue(target.value);
		target.value = value;
		updateActiveIndex();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			focusInput(Math.max(0, activeIndex - 1));
			return;
		}

		if (event.key === 'ArrowRight') {
			event.preventDefault();
			focusInput(Math.min(CODE_LENGTH - 1, activeIndex + 1));
		}
	}

	function handlePaste(event: ClipboardEvent) {
		event.preventDefault();

		const clipboard = event.clipboardData;

		if (!clipboard) {
			return;
		}

		let pasted = extractDigits(clipboard.getData('text/plain') || clipboard.getData('text'));

		if (!pasted && clipboard.types.includes('text/html')) {
			const text = clipboard
				.getData('text/html')
				.replace(/<[^>]+>/g, ' ')
				.replace(/\s+/g, ' ');
			pasted = extractDigits(text);
		}

		if (!pasted) {
			return;
		}

		setValue(pasted);
		syncInputElement();
		focusInput(Math.min(value.length, CODE_LENGTH - 1));
	}

	function handleClick(event: MouseEvent) {
		const target = event.currentTarget;

		if (!inputEl || disabled || !(target instanceof HTMLInputElement)) {
			return;
		}

		const bounds = target.getBoundingClientRect();
		const relativeX = event.clientX - bounds.left;
		const gap = bounds.width >= 360 ? 12 : 8;
		const cellWidth = (bounds.width - gap * (CODE_LENGTH - 1)) / CODE_LENGTH;
		const index = Math.min(
			CODE_LENGTH - 1,
			Math.max(0, Math.floor(relativeX / (cellWidth + gap)))
		);

		focusInput(index);
	}

	$effect(() => {
		const _code = value;
		syncInputElement();
	});
</script>

<div
	class={cn('relative', className)}
	role="group"
	aria-label="Verification code"
	aria-describedby={ariaDescribedBy}
>
	{#if name}
		<input type="hidden" {name} {value} />
	{/if}

	<input
		bind:this={inputEl}
		{id}
		type="text"
		inputmode="numeric"
		autocomplete="one-time-code"
		maxlength={CODE_LENGTH}
		{disabled}
		{value}
		aria-invalid={ariaInvalid}
		class="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
		aria-label="Verification code"
		oninput={handleInput}
		onkeydown={handleKeyDown}
		onpaste={handlePaste}
		onfocus={updateActiveIndex}
		onkeyup={updateActiveIndex}
		onclick={handleClick}
	/>

	<div class="pointer-events-none flex justify-center gap-2 sm:gap-3">
		{#each digits as digit, index (index)}
			<div
				class={cn(
					'border-input bg-background ring-offset-background',
					'size-11 rounded-lg border text-center',
					'font-mono text-lg font-semibold tracking-tight',
					'sm:size-12 sm:text-xl',
					'flex items-center justify-center',
					activeIndex === index && 'border-ring ring-ring ring-2 ring-offset-2'
				)}
				aria-hidden="true"
			>
				{digit}
			</div>
		{/each}
	</div>
</div>
