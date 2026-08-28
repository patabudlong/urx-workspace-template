<script lang="ts">
	import { PM_PROJECT_STATUSES, type PmProjectStatus } from '$lib/shared/models/pm-project';
	import { cn } from '$lib/utils.js';

	let {
		status = $bindable<PmProjectStatus>(PM_PROJECT_STATUSES.PLANNING),
		inputName = 'status',
		idPrefix = ''
	}: {
		status?: PmProjectStatus;
		inputName?: string;
		idPrefix?: string;
	} = $props();

	const statusOptions: {
		value: PmProjectStatus;
		label: string;
		description: string;
		activeClass: string;
	}[] = [
		{
			value: PM_PROJECT_STATUSES.PLANNING,
			label: 'Planning',
			description: 'Scoping and kickoff',
			activeClass: 'border-primary bg-primary/10 text-primary'
		},
		{
			value: PM_PROJECT_STATUSES.ACTIVE,
			label: 'Active',
			description: 'In delivery',
			activeClass: 'border-primary bg-primary/10 text-primary'
		},
		{
			value: PM_PROJECT_STATUSES.ON_HOLD,
			label: 'On hold',
			description: 'Paused for now',
			activeClass: 'border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-400'
		},
		{
			value: PM_PROJECT_STATUSES.COMPLETED,
			label: 'Completed',
			description: 'Delivered',
			activeClass: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
		},
		{
			value: PM_PROJECT_STATUSES.CANCELLED,
			label: 'Cancelled',
			description: 'Closed out',
			activeClass: 'border-destructive/60 bg-destructive/10 text-destructive'
		}
	];
</script>

<input type="hidden" name={inputName} value={status} />

<fieldset class="space-y-3">
	<legend class="text-sm font-medium" id="{idPrefix}status-label">Delivery status</legend>
	<div
		class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
		role="radiogroup"
		aria-labelledby="{idPrefix}status-label"
	>
		{#each statusOptions as option (option.value)}
			{@const selected = status === option.value}
			<button
				type="button"
				class={cn(
					'rounded-xl border p-3 text-left transition-all',
					selected
						? cn(option.activeClass, 'ring-primary/15 shadow-sm ring-2')
						: 'hover:bg-muted/50 border-border bg-background'
				)}
				aria-pressed={selected}
				onclick={() => {
					status = option.value;
				}}
			>
				<span class="block text-sm font-medium">{option.label}</span>
				<span class="text-muted-foreground mt-1 block text-xs">{option.description}</span>
			</button>
		{/each}
	</div>
</fieldset>
