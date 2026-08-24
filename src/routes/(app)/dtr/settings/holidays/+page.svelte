<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import DtrHolidayYearOverview from '$lib/components/dtr/dtr-holiday-year-overview.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import {
		DTR_HOLIDAY_CATEGORY_LABELS,
		DTR_HOLIDAY_DEFAULT_RATES,
		formatHolidayPayPercent,
		type DtrHolidayCategory
	} from '$lib/shared/dtr/holidays';
	import {
		DTR_HOLIDAY_CALENDAR_SAVED_MESSAGE,
		DTR_HOLIDAY_CALENDAR_SAVE_FAILED_MESSAGE
	} from '$lib/shared/dtr/messages';
	import { dtrHolidayCalendarSchema } from '$lib/shared/dtr/schemas';
	import {
		DTR_HOLIDAY_CATEGORY_BADGE_CLASSES,
		DTR_HOLIDAY_CATEGORY_CARD_CLASSES
	} from '$lib/components/dtr/dtr-holiday-category-styles';
	import { cn } from '$lib/utils.js';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import PercentIcon from '@lucide/svelte/icons/percent';
	import { goto, invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let submitting = $state(false);
	let showSuccess = $state(false);

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(dtrHolidayCalendarSchema),
		dataType: 'json',
		resetForm: false,
		onSubmit: () => {
			filterIncompleteHolidays();
			submitting = true;
			showSuccess = false;
		},
		onUpdated: async ({ form: updatedForm }) => {
			submitting = false;

			if (updatedForm.message === DTR_HOLIDAY_CALENDAR_SAVED_MESSAGE) {
				showSuccess = true;
				await invalidateAll();
				return;
			}

			if (!updatedForm.valid) {
				showSuccess = false;
			}
		},
		onError: () => {
			submitting = false;
			showSuccess = false;
		}
	});

	const { enhance, form, message: formMessage } = superform;

	const categoryFields: Array<{
		key: 'regularHoliday' | 'specialNonWorkingDay' | 'specialWorkingDay';
		label: string;
		category: DtrHolidayCategory;
	}> = [
		{
			key: 'regularHoliday',
			label: DTR_HOLIDAY_CATEGORY_LABELS.regular,
			category: 'regular'
		},
		{
			key: 'specialNonWorkingDay',
			label: DTR_HOLIDAY_CATEGORY_LABELS.special_non_working,
			category: 'special_non_working'
		},
		{
			key: 'specialWorkingDay',
			label: DTR_HOLIDAY_CATEGORY_LABELS.special_working,
			category: 'special_working'
		}
	];

	const holidayCategoryOptions = Object.entries(DTR_HOLIDAY_CATEGORY_LABELS) as Array<
		[DtrHolidayCategory, string]
	>;

	const currentYear = $derived(new Date().getFullYear());

	const savedCalendarYears = $derived(
		data.calendars.map((calendar) => calendar.year).sort((a, b) => a - b)
	);

	const completeHolidayCount = $derived(
		$form.holidays.filter(
			(holiday) => holiday.name.trim().length > 0 && holiday.date.trim().length > 0
		).length
	);

	const sortedHolidayRows = $derived(
		$form.holidays
			.map((holiday, originalIndex) => ({ holiday, originalIndex }))
			.sort((left, right) => left.holiday.date.localeCompare(right.holiday.date))
	);

	const formError = $derived(
		typeof $formMessage === 'string' &&
			$formMessage.length > 0 &&
			$formMessage !== DTR_HOLIDAY_CALENDAR_SAVED_MESSAGE
	);

	const hasValidationErrors = $derived(
		typeof $formMessage === 'string' &&
			$formMessage.includes('Check the calendar title') &&
			!showSuccess
	);

	function changeYear(year: number) {
		void goto(`/dtr/settings/holidays?year=${year}`, { keepFocus: true, noScroll: true });
	}

	function shiftYear(delta: number) {
		changeYear(data.year + delta);
	}

	function addHoliday() {
		$form.holidays = [
			...$form.holidays,
			{
				date: `${$form.year}-01-01`,
				name: '',
				category: 'regular' as DtrHolidayCategory
			}
		];
	}

	function removeHoliday(index: number) {
		$form.holidays = $form.holidays.filter((_, currentIndex) => currentIndex !== index);
	}

	function filterIncompleteHolidays() {
		$form.holidays = $form.holidays.filter(
			(holiday) => holiday.name.trim().length > 0 && holiday.date.trim().length > 0
		);
	}

	function formatDisplayDate(date: string): string {
		if (!date.trim()) {
			return '—';
		}

		const [year, month, day] = date.split('-').map(Number);
		return new Intl.DateTimeFormat(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(new Date(year, month - 1, day));
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="DTR settings"
		title="Holiday calendar"
		description="Set annual holidays and pay percentages for worked and unworked days. Credits apply when time records are saved or imported."
	/>

	<Card.Root>
		<Card.Header class="border-b">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div class="space-y-1">
					<Card.Title class="flex items-center gap-2">
						<CalendarDaysIcon class="text-muted-foreground size-5" aria-hidden="true" />
						Calendar year
					</Card.Title>
					<Card.Description>
						Choose a year to edit. Saved calendars:
						{#if savedCalendarYears.length === 0}
							none yet.
						{:else}
							<span class="text-foreground font-medium">
								{savedCalendarYears.join(', ')}.
							</span>
						{/if}
					</Card.Description>
				</div>
				{#if data.year === currentYear}
					<Badge variant="secondary" class="font-normal">Current year</Badge>
				{/if}
			</div>
		</Card.Header>
		<Card.Content class="space-y-5 pt-6">
			<div class="flex flex-wrap items-center gap-2">
				<Button
					type="button"
					variant="outline"
					size="icon"
					class="size-10 shrink-0"
					aria-label="Previous year"
					onclick={() => shiftYear(-1)}
				>
					<ChevronLeftIcon class="size-4" aria-hidden="true" />
				</Button>

				<div class="bg-muted/30 flex h-10 min-w-28 items-center justify-center rounded-md border px-4">
					<span class="text-sm font-semibold tracking-tight">{data.year}</span>
				</div>

				<Button
					type="button"
					variant="outline"
					size="icon"
					class="size-10 shrink-0"
					aria-label="Next year"
					onclick={() => shiftYear(1)}
				>
					<ChevronRightIcon class="size-4" aria-hidden="true" />
				</Button>

				{#each savedCalendarYears as savedYear (savedYear)}
					{#if savedYear !== data.year}
						<Button
							type="button"
							variant="outline"
							class="h-10"
							onclick={() => changeYear(savedYear)}
						>
							{savedYear}
						</Button>
					{/if}
				{/each}
			</div>

			{#if completeHolidayCount > 0}
				<div class="bg-muted/25 rounded-xl border p-4 sm:p-5">
					<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
						<p class="text-sm font-semibold tracking-tight">{data.year} overview</p>
						<span class="text-muted-foreground text-xs">
							{completeHolidayCount} holiday{completeHolidayCount === 1 ? '' : 's'} configured
						</span>
					</div>
					<DtrHolidayYearOverview year={data.year} holidays={$form.holidays} />
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<form method="POST" class="space-y-8" use:enhance>
		<Card.Root>
			<Card.Header class="border-b">
				<Card.Title>Calendar details</Card.Title>
				<Card.Description>Title and default pay rules for each holiday type.</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6 pt-6">
				{#if showSuccess}
					<StatusAlert
						variant="success"
						title="Holiday calendar saved"
						description={DTR_HOLIDAY_CALENDAR_SAVED_MESSAGE}
					/>
				{:else if formError}
					<StatusAlert
						variant="danger"
						title="Could not save holiday calendar"
						description={$formMessage === DTR_HOLIDAY_CALENDAR_SAVE_FAILED_MESSAGE
							? DTR_HOLIDAY_CALENDAR_SAVE_FAILED_MESSAGE
							: String($formMessage)}
					/>
				{:else if hasValidationErrors}
					<StatusAlert
						variant="danger"
						title="Could not save holiday calendar"
						description="Check the calendar title, pay percentages, and holiday dates."
					/>
				{/if}

				<div class="grid gap-5 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label for="holiday-year">Year</Label>
						<Input
							id="holiday-year"
							bind:value={$form.year}
							type="number"
							min="2000"
							max="2100"
							class="h-10 bg-muted/30"
						/>
					</div>
					<div class="grid gap-2">
						<Label for="holiday-title">Calendar title</Label>
						<Input id="holiday-title" bind:value={$form.title} class="h-10 bg-muted/30" />
					</div>
				</div>

				<div class="space-y-3">
					<div class="flex items-center gap-2">
						<PercentIcon class="text-muted-foreground size-4" aria-hidden="true" />
						<p class="text-sm font-medium">Pay percentages by holiday type</p>
					</div>

					<div class="grid gap-4 lg:grid-cols-3">
						{#each categoryFields as category (category.key)}
							<div
								class={cn(
									'space-y-4 rounded-xl border p-4',
									DTR_HOLIDAY_CATEGORY_CARD_CLASSES[category.category]
								)}
							>
								<div class="space-y-1">
									<p class="text-sm font-semibold">{category.label}</p>
									<p class="text-muted-foreground text-xs">
										Default unworked:
										{formatHolidayPayPercent(
											DTR_HOLIDAY_DEFAULT_RATES[category.key].unworkedPercent
										)}
										· worked:
										{formatHolidayPayPercent(
											DTR_HOLIDAY_DEFAULT_RATES[category.key].workedPercent
										)}
									</p>
								</div>
								<div class="grid gap-2">
									<Label for="{category.key}-worked">Worked (%)</Label>
									<Input
										id="{category.key}-worked"
										bind:value={$form[category.key].workedPercent}
										type="number"
										min="0"
										max="300"
										step="1"
										class="h-10 bg-background/80"
									/>
								</div>
								<div class="grid gap-2">
									<Label for="{category.key}-unworked">Unworked (%)</Label>
									<Input
										id="{category.key}-unworked"
										bind:value={$form[category.key].unworkedPercent}
										type="number"
										min="0"
										max="300"
										step="1"
										class="h-10 bg-background/80"
									/>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="border-b">
				<Card.Title>Holidays</Card.Title>
				<Card.Description>
					Add each date with its holiday type. Empty rows are ignored when you save.
				</Card.Description>
				<Card.Action>
					<Button type="button" variant="outline" class="h-10" onclick={addHoliday}>
						<PlusIcon class="size-4" aria-hidden="true" />
						Add holiday
					</Button>
				</Card.Action>
			</Card.Header>
			<Card.Content class="pt-6">
				{#if $form.holidays.length === 0}
					<StatusAlert
						variant="info"
						title="No holidays yet"
						description="Add dates for {data.year}, then save the calendar."
					/>
				{:else}
					<div class="overflow-x-auto rounded-xl border">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head class="min-w-36">Date</Table.Head>
									<Table.Head class="min-w-48">Name</Table.Head>
									<Table.Head class="min-w-44">Type</Table.Head>
									<Table.Head class="w-12"></Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each sortedHolidayRows as row (row.originalIndex)}
									{@const index = row.originalIndex}
									<Table.Row>
										<Table.Cell class="align-top">
											<Input
												bind:value={$form.holidays[index].date}
												type="date"
												class="h-10 bg-muted/30"
											/>
											{#if $form.holidays[index].date.trim()}
												<p class="text-muted-foreground mt-1 text-xs">
													{formatDisplayDate($form.holidays[index].date)}
												</p>
											{/if}
										</Table.Cell>
										<Table.Cell class="align-top">
											<Input bind:value={$form.holidays[index].name} class="h-10 bg-muted/30" />
										</Table.Cell>
										<Table.Cell class="align-top">
											<Select.Root type="single" bind:value={$form.holidays[index].category}>
												<Select.Trigger class="h-10 w-full bg-muted/30">
													{DTR_HOLIDAY_CATEGORY_LABELS[$form.holidays[index].category]}
												</Select.Trigger>
												<Select.Content>
													{#each holidayCategoryOptions as [value, label] (value)}
														<Select.Item value={value} label={label}>{label}</Select.Item>
													{/each}
												</Select.Content>
											</Select.Root>
											<span
												class={cn(
													'mt-2 inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium',
													DTR_HOLIDAY_CATEGORY_BADGE_CLASSES[$form.holidays[index].category]
												)}
											>
												{DTR_HOLIDAY_CATEGORY_LABELS[$form.holidays[index].category]}
											</span>
										</Table.Cell>
										<Table.Cell class="align-top">
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												aria-label="Remove holiday"
												onclick={() => removeHoliday(index)}
											>
												<Trash2Icon class="size-4" />
											</Button>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<Button type="submit" class="h-10" disabled={submitting}>
			{#if submitting}
				<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
				Saving calendar…
			{:else}
				Save holiday calendar
			{/if}
		</Button>
	</form>
</div>
