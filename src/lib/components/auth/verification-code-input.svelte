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

	let inputEls = $state<(HTMLInputElement | null)[]>(
		Array.from({ length: CODE_LENGTH }, () => null)
	);
	let slots = $state<string[]>(Array.from({ length: CODE_LENGTH }, () => ''));
	let activeIndex = $state(0);
	let ignoreExternalSync = false;

	function extractDigits(text: string): string {
		const normalized = text.replace(/[\uFF10-\uFF19]/g, (character) =>
			String.fromCharCode(character.charCodeAt(0) - 0xff10 + 0x30)
		);

		return normalized.replace(/\D/g, '').slice(0, CODE_LENGTH);
	}

	function slotsFromCode(code: string): string[] {
		return Array.from({ length: CODE_LENGTH }, (_, index) => code[index] ?? '');
	}

	function publish(nextSlots: string[]) {
		slots = nextSlots;
		const nextValue = nextSlots.join('');
		ignoreExternalSync = true;
		value = nextValue;
		void tick().then(() => {
			ignoreExternalSync = false;
		});
	}

	$effect(() => {
		const code = extractDigits(value ?? '');
		if (ignoreExternalSync) {
			return;
		}
		const nextSlots = slotsFromCode(code);
		if (nextSlots.some((digit, index) => digit !== slots[index])) {
			slots = nextSlots;
		}
	});

	function focusIndex(index: number) {
		if (disabled) {
			return;
		}

		const next = Math.min(Math.max(index, 0), CODE_LENGTH - 1);
		activeIndex = next;
		const el = inputEls[next];
		if (!el) {
			return;
		}

		el.focus({ preventScroll: true });
		el.select();
	}

	function registerInput(node: HTMLInputElement, index: number) {
		inputEls[index] = node;
		return {
			destroy() {
				if (inputEls[index] === node) {
					inputEls[index] = null;
				}
			}
		};
	}

	function setDigit(index: number, digit: string) {
		const nextSlots = [...slots];
		nextSlots[index] = digit;
		publish(nextSlots);
	}

	function clearDigit(index: number) {
		if (!slots[index]) {
			return;
		}
		const nextSlots = [...slots];
		nextSlots[index] = '';
		publish(nextSlots);
	}

	export function focus() {
		if (disabled) {
			return;
		}

		const firstEmpty = slots.findIndex((digit) => !digit);
		focusIndex(firstEmpty === -1 ? CODE_LENGTH - 1 : firstEmpty);
	}

	export function typeDigit(digit: string) {
		if (disabled || !/^\d$/.test(digit)) {
			return;
		}

		const index = Math.min(activeIndex, CODE_LENGTH - 1);
		setDigit(index, digit);
		void tick().then(() => {
			focusIndex(index < CODE_LENGTH - 1 ? index + 1 : index);
		});
	}

	function handleBeforeInput(index: number, event: InputEvent) {
		if (disabled) {
			event.preventDefault();
			return;
		}

		if (event.inputType.startsWith('delete')) {
			event.preventDefault();
			clearDigit(index);
			return;
		}

		if (event.inputType === 'insertText' && event.data) {
			event.preventDefault();
			const digit = extractDigits(event.data).slice(-1);
			if (!digit) {
				return;
			}

			setDigit(index, digit);
			void tick().then(() => {
				focusIndex(index < CODE_LENGTH - 1 ? index + 1 : index);
			});
		}
	}

	function handleKeyDown(index: number, event: KeyboardEvent) {
		if (event.key === 'Backspace') {
			event.preventDefault();

			if (slots[index]) {
				clearDigit(index);
				return;
			}

			if (index > 0) {
				clearDigit(index - 1);
				void tick().then(() => focusIndex(index - 1));
			}
			return;
		}

		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			focusIndex(index - 1);
			return;
		}

		if (event.key === 'ArrowRight') {
			event.preventDefault();
			focusIndex(index + 1);
			return;
		}

		if (event.key === 'Delete') {
			event.preventDefault();
			clearDigit(index);
		}
	}

	function handlePaste(index: number, event: ClipboardEvent) {
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

		if (index === 0) {
			publish(slotsFromCode(pasted));
			void tick().then(() => focusIndex(Math.min(pasted.length, CODE_LENGTH - 1)));
			return;
		}

		const nextSlots = [...slots];
		for (let offset = 0; offset < pasted.length && index + offset < CODE_LENGTH; offset++) {
			nextSlots[index + offset] = pasted[offset]!;
		}
		publish(nextSlots);
		void tick().then(() =>
			focusIndex(Math.min(index + pasted.length, CODE_LENGTH - 1))
		);
	}

	function handleFocus(index: number) {
		activeIndex = index;
		inputEls[index]?.select();
	}

	$effect(() => {
		if (!autofocus || disabled) {
			return;
		}

		let cancelled = false;
		let retryId = 0;

		void tick().then(() => {
			if (cancelled || disabled) {
				return;
			}

			const firstEmpty = slots.findIndex((digit) => !digit);
			focusIndex(firstEmpty === -1 ? CODE_LENGTH - 1 : firstEmpty);

			retryId = window.setTimeout(() => {
				if (cancelled || disabled) {
					return;
				}

				const el = inputEls[activeIndex];
				if (el && document.activeElement !== el) {
					focusIndex(activeIndex);
				}
			}, 50);
		});

		return () => {
			cancelled = true;
			window.clearTimeout(retryId);
		};
	});
</script>

<div
	class={cn(className)}
	role="group"
	aria-label="Verification code"
	aria-describedby={ariaDescribedBy}
>
	{#if name}
		<input type="hidden" {name} value={slots.join('')} />
	{/if}

	<div class="flex justify-center gap-2 sm:gap-3">
		{#each slots as digit, index (index)}
			<input
				use:registerInput={index}
				id={index === 0 ? id : undefined}
				type="text"
				inputmode="numeric"
				autocomplete={index === 0 ? 'one-time-code' : 'off'}
				maxlength={1}
				{disabled}
				value={digit}
				data-verification-code-input
				aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
				aria-invalid={ariaInvalid}
				class={cn(
					'border-input bg-background ring-offset-background',
					'size-11 rounded-lg border text-center',
					'font-mono text-lg font-semibold tracking-tight',
					'sm:size-12 sm:text-xl',
					'outline-none transition-shadow',
					'focus-visible:border-ring focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2',
					!disabled && activeIndex === index && 'border-ring ring-ring ring-2 ring-offset-2',
					disabled && 'cursor-not-allowed opacity-50'
				)}
				onbeforeinput={(event) => handleBeforeInput(index, event)}
				onkeydown={(event) => handleKeyDown(index, event)}
				onpaste={(event) => handlePaste(index, event)}
				onfocus={() => handleFocus(index)}
			/>
		{/each}
	</div>
</div>
