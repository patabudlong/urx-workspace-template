<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { tick } from 'svelte';

	const CODE_LENGTH = 6;

	let {
		value = $bindable(''),
		name,
		disabled = false,
		autofocus = false,
		id,
		'aria-invalid': ariaInvalid = undefined,
		'aria-describedby': ariaDescribedBy = undefined,
		class: className
	}: {
		value?: string;
		name?: string;
		disabled?: boolean;
		autofocus?: boolean;
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

	function placeCaret(index: number) {
		if (!inputEl || disabled) {
			return;
		}

		const position = Math.min(Math.max(index, 0), value.length, CODE_LENGTH);
		inputEl.focus({ preventScroll: true });
		inputEl.setSelectionRange(position, position);
		activeIndex = Math.min(position, CODE_LENGTH - 1);
	}

	export function focus() {
		if (disabled || !inputEl) {
			return;
		}

		placeCaret(Math.min(value.length, CODE_LENGTH - 1));
	}

	export function typeDigit(digit: string) {
		if (disabled || !/^\d$/.test(digit) || value.length >= CODE_LENGTH) {
			return;
		}

		setValue(value + digit);
		syncInputElement();
		placeCaret(value.length);
	}

	function handleInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const previousLength = value.length;
		setValue(target.value);
		target.value = value;

		if (value.length >= previousLength) {
			placeCaret(value.length);
			return;
		}

		placeCaret(target.selectionStart ?? value.length);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (
			event.key === 'Backspace' &&
			value.length > 0 &&
			(inputEl?.selectionStart ?? 0) === (inputEl?.selectionEnd ?? 0)
		) {
			const caret = inputEl?.selectionStart ?? value.length;

			if (caret === 0) {
				return;
			}

			if (caret === value.length) {
				event.preventDefault();
				setValue(value.slice(0, -1));
				syncInputElement();
				placeCaret(value.length);
				return;
			}
		}

		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			placeCaret(Math.max(0, activeIndex - 1));
			return;
		}

		if (event.key === 'ArrowRight') {
			event.preventDefault();
			placeCaret(Math.min(value.length, activeIndex + 1));
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
		placeCaret(value.length);
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

		placeCaret(Math.min(index, value.length));
	}

	function handleFocus() {
		placeCaret(Math.min(value.length, CODE_LENGTH - 1));
	}

	$effect(() => {
		const _code = value;
		syncInputElement();
	});

	$effect(() => {
		if (!autofocus || disabled) {
			return;
		}

		const el = inputEl;

		if (!el) {
			return;
		}

		let cancelled = false;
		let retryId = 0;

		void tick().then(() => {
			if (cancelled || disabled) {
				return;
			}

			el.focus({ preventScroll: true });
			const position = Math.min(el.value.length, CODE_LENGTH - 1);
			el.setSelectionRange(position, position);
			activeIndex = position;

			retryId = window.setTimeout(() => {
				if (cancelled || disabled || document.activeElement === el) {
					return;
				}

				el.focus({ preventScroll: true });
				el.setSelectionRange(position, position);
				activeIndex = position;
			}, 50);
		});

		return () => {
			cancelled = true;
			window.clearTimeout(retryId);
		};
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
		data-verification-code-input
		aria-invalid={ariaInvalid}
		class="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
		aria-label="Verification code"
		oninput={handleInput}
		onkeydown={handleKeyDown}
		onpaste={handlePaste}
		onfocus={handleFocus}
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
					!disabled && activeIndex === index && 'border-ring ring-ring ring-2 ring-offset-2'
				)}
				aria-hidden="true"
			>
				{digit}
			</div>
		{/each}
	</div>
</div>
