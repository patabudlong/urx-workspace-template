<script lang="ts">
	import { cn } from '$lib/utils.js';

	const CODE_LENGTH = 6;

	let {
		value = $bindable(''),
		disabled = false,
		id,
		'aria-invalid': ariaInvalid = undefined,
		'aria-describedby': ariaDescribedBy = undefined,
		class: className
	}: {
		value?: string;
		disabled?: boolean;
		id?: string;
		'aria-invalid'?: boolean | 'true' | 'false';
		'aria-describedby'?: string;
		class?: string;
	} = $props();

	let inputs: HTMLInputElement[] = $state([]);

	const digits = $derived(
		Array.from({ length: CODE_LENGTH }, (_, index) => value[index] ?? '')
	);

	function syncValue(nextDigits: string[]) {
		value = Array.from({ length: CODE_LENGTH }, (_, index) => nextDigits[index] ?? '')
			.join('')
			.replace(/\D/g, '')
			.slice(0, CODE_LENGTH);
	}

	function focusInput(index: number) {
		const input = inputs[index];

		if (input) {
			input.focus();
			input.select();
		}
	}

	function handleInput(event: Event, index: number) {
		const target = event.currentTarget as HTMLInputElement;
		const digitsOnly = target.value.replace(/\D/g, '');

		if (digitsOnly.length > 1) {
			const merged = [...digits.slice(0, index), ...digitsOnly.split('')]
				.join('')
				.slice(0, CODE_LENGTH);
			syncValue(merged.split(''));
			target.value = merged[index] ?? '';
			focusInput(Math.min(merged.length, CODE_LENGTH - 1));
			return;
		}

		const digit = digitsOnly.slice(-1);
		const nextDigits = [...digits];
		nextDigits[index] = digit;
		syncValue(nextDigits);
		target.value = digit;

		if (digit && index < CODE_LENGTH - 1) {
			focusInput(index + 1);
		}
	}

	function handleKeyDown(event: KeyboardEvent, index: number) {
		if (event.key === 'Backspace' && !digits[index] && index > 0) {
			event.preventDefault();
			const nextDigits = [...digits];
			nextDigits[index - 1] = '';
			syncValue(nextDigits);
			focusInput(index - 1);
			return;
		}

		if (event.key === 'ArrowLeft' && index > 0) {
			event.preventDefault();
			focusInput(index - 1);
			return;
		}

		if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
			event.preventDefault();
			focusInput(index + 1);
		}
	}

	function handlePaste(event: ClipboardEvent) {
		event.preventDefault();
		const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH) ?? '';

		if (!pasted) {
			return;
		}

		syncValue(pasted.split(''));
		focusInput(Math.min(pasted.length, CODE_LENGTH - 1));
	}
</script>

<div
	{id}
	class={cn('flex justify-center gap-2 sm:gap-3', className)}
	role="group"
	aria-label="Verification code"
	aria-describedby={ariaDescribedBy}
	onpaste={handlePaste}
>
	{#each digits as digit, index (index)}
		<input
			bind:this={inputs[index]}
			type="text"
			inputmode="numeric"
			autocomplete={index === 0 ? 'one-time-code' : 'off'}
			maxlength={1}
			{disabled}
			value={digit}
			aria-invalid={ariaInvalid}
			class={cn(
				'border-input bg-background ring-offset-background',
				'focus-visible:ring-ring size-11 rounded-lg border text-center',
				'font-mono text-lg font-semibold tracking-tight',
				'sm:size-12 sm:text-xl',
				'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
				'disabled:cursor-not-allowed disabled:opacity-50'
			)}
			aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
			oninput={(event) => handleInput(event, index)}
			onkeydown={(event) => handleKeyDown(event, index)}
			onpaste={handlePaste}
		/>
	{/each}
</div>
