<script lang="ts">
	import PasswordStrength from '$lib/components/password-strength.svelte';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import type { ComponentProps } from 'svelte';

	type PasswordInputProps = WithElementRef<Omit<ComponentProps<typeof Input>, 'type' | 'files'>> & {
		showStrength?: boolean;
		showReuseHint?: boolean;
		groupClass?: string;
	};

	let {
		class: className,
		groupClass,
		value = $bindable(''),
		showStrength = false,
		showReuseHint = false,
		...restProps
	}: PasswordInputProps = $props();

	let visible = $state(false);
</script>

<div class="space-y-3">
	<InputGroup.Root class={groupClass}>
		<InputGroup.Input
			{...restProps}
			bind:value
			type={visible ? 'text' : 'password'}
			class={cn(groupClass && 'h-full', className)}
		/>
		<InputGroup.Addon align="inline-end">
			<InputGroup.Button
				type="button"
				size="icon-sm"
				class="active:translate-y-0 rounded-none hover:bg-transparent focus-visible:ring-0 dark:hover:bg-transparent"
				onclick={() => (visible = !visible)}
				aria-label={visible ? 'Hide password' : 'Show password'}
			>
				<span class="grid size-4 place-items-center [&>svg]:col-start-1 [&>svg]:row-start-1" aria-hidden="true">
					<EyeOffIcon class={cn('size-4', !visible && 'invisible')} />
					<EyeIcon class={cn('size-4', visible && 'invisible')} />
				</span>
			</InputGroup.Button>
		</InputGroup.Addon>
	</InputGroup.Root>

	{#if showStrength === true}
		<PasswordStrength password={value} {showReuseHint} />
	{/if}
</div>
