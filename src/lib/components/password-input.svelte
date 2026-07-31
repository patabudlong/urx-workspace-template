<script lang="ts">
	import PasswordStrength from '$lib/components/password-strength.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import type { ComponentProps } from 'svelte';

	type PasswordInputProps = WithElementRef<Omit<ComponentProps<typeof Input>, 'type' | 'files'>> & {
		showStrength?: boolean;
	};

	let {
		class: className,
		value = $bindable(''),
		showStrength = false,
		...restProps
	}: PasswordInputProps = $props();

	let visible = $state(false);
</script>

<div class="space-y-3">
	<div class="relative">
		<Input
			{...restProps}
			bind:value
			type={visible ? 'text' : 'password'}
			class={cn('pr-9', className)}
		/>
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			class="absolute top-1/2 right-1 -translate-y-1/2"
			onclick={() => (visible = !visible)}
			aria-label={visible ? 'Hide password' : 'Show password'}
		>
			{#if visible}
				<EyeOffIcon class="size-4" />
			{:else}
				<EyeIcon class="size-4" />
			{/if}
		</Button>
	</div>

	{#if showStrength === true}
		<PasswordStrength password={value} />
	{/if}
</div>
