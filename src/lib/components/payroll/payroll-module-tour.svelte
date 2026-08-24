<script lang="ts">
	import { browser } from '$app/environment';
	import OnboardingElementTour from '$lib/components/onboarding/onboarding-element-tour.svelte';
	import {
		dismissPayrollTour,
		isPayrollTourDismissed,
		PAYROLL_TOUR_STEPS
	} from '$lib/shared/payroll/tour';

	let {
		active = $bindable(false),
		autoStart = false,
		restartKey = 0
	}: {
		active?: boolean;
		autoStart?: boolean;
		restartKey?: number;
	} = $props();

	$effect(() => {
		if (!browser || !autoStart || active) {
			return;
		}

		if (!isPayrollTourDismissed()) {
			active = true;
		}
	});

	function handleDismiss() {
		active = false;
		dismissPayrollTour();
	}
</script>

{#if active}
	{#key restartKey}
		<OnboardingElementTour
			steps={PAYROLL_TOUR_STEPS}
			stepKey="payroll-overview"
			bind:active
			onDismiss={handleDismiss}
		/>
	{/key}
{/if}
