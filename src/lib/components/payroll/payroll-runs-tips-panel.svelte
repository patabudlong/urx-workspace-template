<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import CalendarRangeIcon from '@lucide/svelte/icons/calendar-range';
	import LightbulbIcon from '@lucide/svelte/icons/lightbulb';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import UsersIcon from '@lucide/svelte/icons/users';

	let {
		open = $bindable(false),
		payFrequencyLabel,
		settingsConfigured
	}: {
		open?: boolean;
		payFrequencyLabel: string;
		settingsConfigured: boolean;
	} = $props();

	const scheduleLabel = $derived(
		settingsConfigured
			? `Based on your ${payFrequencyLabel.toLowerCase()} schedule.`
			: `Using default ${payFrequencyLabel.toLowerCase()} schedule.`
	);
</script>

<Button
	type="button"
	variant="outline"
	class="h-10"
	aria-expanded={open}
	aria-controls="payroll-runs-tips-panel"
	onclick={() => (open = true)}
>
	<LightbulbIcon class="size-4" aria-hidden="true" />
	Tips
</Button>

<Sheet.Root bind:open>
	<Sheet.Content id="payroll-runs-tips-panel" side="right" class="w-full sm:max-w-md">
		<Sheet.Header class="border-b pb-4">
			<div class="flex items-start gap-3 pr-8">
				<div
					class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg"
				>
					<LightbulbIcon class="size-5" aria-hidden="true" />
				</div>
				<div class="min-w-0 space-y-1">
					<Sheet.Title>Pay run tips</Sheet.Title>
					<Sheet.Description>
						Quick guidance for creating and processing pay periods.
					</Sheet.Description>
				</div>
			</div>
		</Sheet.Header>

		<div class="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6">
			<div class="border-primary/20 bg-primary/5 flex gap-3 rounded-lg border p-4" role="note">
				<CalendarRangeIcon class="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
				<div class="min-w-0 space-y-1">
					<p class="text-sm font-medium">Suggested period</p>
					<p class="text-muted-foreground text-sm leading-relaxed">
						{scheduleLabel} Dates in the create form are pre-filled — adjust if needed or update
						your pay schedule in settings.
					</p>
				</div>
			</div>

			<div class="space-y-3 rounded-lg border p-4">
				<div class="flex gap-3">
					<UsersIcon class="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
					<div class="min-w-0 space-y-1">
						<p class="text-sm font-medium">Start with employees</p>
						<p class="text-muted-foreground text-sm leading-relaxed">
							Add active employees with pay rates and deductions before processing a run.
						</p>
					</div>
				</div>
			</div>

			<div class="space-y-3 rounded-lg border p-4">
				<div class="flex gap-3">
					<CalendarRangeIcon
						class="text-muted-foreground mt-0.5 size-4 shrink-0"
						aria-hidden="true"
					/>
					<div class="min-w-0 space-y-1">
						<p class="text-sm font-medium">Draft → process → review</p>
						<p class="text-muted-foreground text-sm leading-relaxed">
							Create a draft for the pay period, process it to generate payslips from DTR records,
							then review totals before marking complete.
						</p>
					</div>
				</div>
			</div>

			{#if !settingsConfigured}
				<div class="bg-muted/40 flex gap-3 rounded-lg border border-dashed p-4">
					<SettingsIcon class="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
					<div class="min-w-0 space-y-2">
						<p class="text-sm font-medium">Configure payroll settings</p>
						<p class="text-muted-foreground text-sm leading-relaxed">
							Set pay frequency, currency, and timezone so period suggestions match your team.
						</p>
						<Button href="/payroll/settings" variant="outline" size="sm" class="h-8">
							Open settings
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>
