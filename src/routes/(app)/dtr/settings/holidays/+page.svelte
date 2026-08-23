<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import {
		DTR_HOLIDAY_CATEGORY_LABELS,
		type DtrHolidayCategory
	} from '$lib/shared/dtr/holidays';
	import {
		DTR_HOLIDAY_CALENDAR_SAVED_MESSAGE,
		DTR_HOLIDAY_CALENDAR_SAVE_FAILED_MESSAGE
	} from '$lib/shared/dtr/messages';
	import { dtrHolidayCalendarSchema } from '$lib/shared/dtr/schemas';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { goto, invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	let submitting = $state(false);

	const superform = superForm(untrack(() => data.form), {
		dataType: 'json',
		resetForm: false,
		onSubmit: () => {
			filterIncompleteHolidays();
			submitting = true;
		},
		onUpdated: async ({ form: updatedForm }) => {
			submitting = false;

			if (updatedForm.message === DTR_HOLIDAY_CALENDAR_SAVED_MESSAGE) {
				toast.success('Holiday calendar saved', {
					description: DTR_HOLIDAY_CALENDAR_SAVED_MESSAGE
				});
				await invalidateAll();
				return;
			}

			if (typeof updatedForm.message === 'string' && updatedForm.message.length > 0) {
				toast.error('Could not save holiday calendar', {
					description:
						updatedForm.message === DTR_HOLIDAY_CALENDAR_SAVE_FAILED_MESSAGE
							? DTR_HOLIDAY_CALENDAR_SAVE_FAILED_MESSAGE
							: updatedForm.message
				});
			} else if (!updatedForm.valid) {
				toast.error('Could not save holiday calendar', {
					description: 'Check the calendar title, pay percentages, and holiday dates.'
				});
			}
		},
		onError: () => {
			submitting = false;
			toast.error('Could not save holiday calendar', {
				description: DTR_HOLIDAY_CALENDAR_SAVE_FAILED_MESSAGE
			});
		}
	});

	const { enhance, form } = superform;

	const categoryFields: Array<{
		key: 'regularHoliday' | 'specialNonWorkingDay' | 'specialWorkingDay';
		label: string;
	}> = [
		{ key: 'regularHoliday', label: DTR_HOLIDAY_CATEGORY_LABELS.regular },
		{ key: 'specialNonWorkingDay', label: DTR_HOLIDAY_CATEGORY_LABELS.special_non_working },
		{ key: 'specialWorkingDay', label: DTR_HOLIDAY_CATEGORY_LABELS.special_working }
	];

	const holidayCategoryOptions = Object.entries(DTR_HOLIDAY_CATEGORY_LABELS) as Array<
		[DtrHolidayCategory, string]
	>;

	function changeYear(year: number) {
		void goto(`/dtr/settings/holidays?year=${year}`, { keepFocus: true, noScroll: true });
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
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="DTR settings"
		title="Holiday calendar"
		description="Set annual holidays and pay percentages for worked and unworked days. Credits apply when time records are saved or imported."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>Calendar year</Card.Title>
			<Card.Description>
				Choose a year to edit. Saved calendars: {data.calendars.length === 0
					? 'none yet'
					: data.calendars.map((calendar) => calendar.year).join(', ')}.
			</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-wrap gap-2">
			{#each [-1, 0, 1] as offset (offset)}
				{@const year = data.year + offset}
				<Button
					type="button"
					variant={year === data.year ? 'default' : 'outline'}
					class="h-10"
					onclick={() => changeYear(year)}
				>
					{year}
				</Button>
			{/each}
		</Card.Content>
	</Card.Root>

	<form method="POST" class="space-y-8" use:enhance>
		<Card.Root>
			<Card.Header>
				<Card.Title>Calendar details</Card.Title>
				<Card.Description>Title and default pay rules for each holiday type.</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6">
				<div class="grid gap-5 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label for="holiday-year">Year</Label>
						<Input id="holiday-year" bind:value={$form.year} type="number" min="2000" max="2100" />
					</div>
					<div class="grid gap-2">
						<Label for="holiday-title">Calendar title</Label>
						<Input id="holiday-title" bind:value={$form.title} />
					</div>
				</div>

				<div class="grid gap-4 lg:grid-cols-3">
					{#each categoryFields as category (category.key)}
						<div class="border-border bg-muted/20 space-y-4 rounded-xl border p-4">
							<p class="text-sm font-semibold">{category.label}</p>
							<div class="grid gap-2">
								<Label for="{category.key}-worked">Worked (%)</Label>
								<Input
									id="{category.key}-worked"
									bind:value={$form[category.key].workedPercent}
									type="number"
									min="0"
									max="300"
									step="1"
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
								/>
							</div>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
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
			<Card.Content>
				{#if $form.holidays.length === 0}
					<p class="text-muted-foreground text-sm">No holidays yet. Add dates for this year.</p>
				{:else}
					<div class="overflow-x-auto rounded-lg border">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Date</Table.Head>
									<Table.Head>Name</Table.Head>
									<Table.Head>Type</Table.Head>
									<Table.Head class="w-12"></Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each $form.holidays as holiday, index (index)}
									<Table.Row>
										<Table.Cell>
											<Input bind:value={$form.holidays[index].date} type="date" class="h-10" />
										</Table.Cell>
										<Table.Cell>
											<Input bind:value={$form.holidays[index].name} class="h-10" />
										</Table.Cell>
										<Table.Cell>
											<Select.Root
												type="single"
												bind:value={$form.holidays[index].category}
											>
												<Select.Trigger class="h-10 w-full">
													{DTR_HOLIDAY_CATEGORY_LABELS[$form.holidays[index].category]}
												</Select.Trigger>
												<Select.Content>
													{#each holidayCategoryOptions as [value, label] (value)}
														<Select.Item value={value} label={label}>{label}</Select.Item>
													{/each}
												</Select.Content>
											</Select.Root>
										</Table.Cell>
										<Table.Cell>
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
