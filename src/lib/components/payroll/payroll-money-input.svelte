<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import type { PayrollCurrency } from '$lib/shared/payroll/currency';
	import {
		getPayrollCurrencyStep,
		getPayrollCurrencySymbol
	} from '$lib/shared/payroll/currency';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, 'type' | 'step' | 'min' | 'inputmode'> & {
			payrollCurrency: PayrollCurrency;
			step?: string;
			min?: string;
			inputmode?: HTMLInputAttributes['inputmode'];
		}
	>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		payrollCurrency,
		class: className,
		disabled = false,
		min = '0',
		step,
		inputmode = 'decimal',
		...restProps
	}: Props = $props();

	const currencySymbol = $derived(getPayrollCurrencySymbol(payrollCurrency));
	const resolvedStep = $derived(step ?? getPayrollCurrencyStep(payrollCurrency));
</script>

<InputGroup.Root class={cn('h-10', className)}>
	<InputGroup.Addon align="inline-start" class="text-muted-foreground tabular-nums">
		<span aria-hidden="true">{currencySymbol}</span>
	</InputGroup.Addon>
	<InputGroup.Input
		bind:ref
		type="number"
		{disabled}
		{min}
		step={resolvedStep}
		{inputmode}
		class="h-10"
		bind:value
		{...restProps}
	/>
</InputGroup.Root>
