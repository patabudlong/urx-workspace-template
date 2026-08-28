<script lang="ts">
	import PmFormSection from '$lib/components/project-management/pm-form-section.svelte';
	import PmProjectStatusPicker from '$lib/components/project-management/pm-project-status-picker.svelte';
	import PmProjectTypePicker from '$lib/components/project-management/pm-project-type-picker.svelte';
	import FormDatePicker from '$lib/components/form/form-date-picker.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import type { PmProjectFormInput } from '$lib/shared/project-management/schemas';

	let {
		form = $bindable<PmProjectFormInput>(),
		idPrefix = ''
	}: {
		form: PmProjectFormInput;
		idPrefix?: string;
	} = $props();
</script>

<div class="space-y-8">
	<PmFormSection
		title="Project basics"
		description="Name the work, classify it, and summarize what you are delivering."
	>
		<div class="space-y-2">
			<Label for="{idPrefix}title">Project title</Label>
			<Input
				id="{idPrefix}title"
				name="title"
				bind:value={form.title}
				autocomplete="off"
				class="h-11 text-base font-medium"
			/>
		</div>

		<PmProjectTypePicker bind:selectedTypes={form.projectTypes} {idPrefix} />

		<div class="space-y-2">
			<Label for="{idPrefix}description">Description (optional)</Label>
			<Textarea
				id="{idPrefix}description"
				name="description"
				bind:value={form.description}
				rows={3}
				class="bg-background min-h-24 resize-y"
			/>
		</div>
	</PmFormSection>

	<PmFormSection
		title="Client and links"
		description="Who this is for and any live URL you already have."
	>
		<div class="grid gap-4 md:grid-cols-2">
			<div class="space-y-2">
				<Label for="{idPrefix}clientName">Client name (optional)</Label>
				<Input
					id="{idPrefix}clientName"
					name="clientName"
					bind:value={form.clientName}
					autocomplete="organization"
					class="bg-background h-10"
				/>
			</div>

			<div class="space-y-2">
				<Label for="{idPrefix}projectUrl">Project URL (optional)</Label>
				<Input
					id="{idPrefix}projectUrl"
					name="projectUrl"
					bind:value={form.projectUrl}
					type="url"
					class="bg-background h-10"
				/>
			</div>
		</div>
	</PmFormSection>

	<PmFormSection
		title="Delivery timeline"
		description="Track where this project sits in your workflow."
	>
		<PmProjectStatusPicker bind:status={form.status} {idPrefix} />

		<Separator />

		<div class="space-y-2">
			<Label for="{idPrefix}dueDate">Target completion date (optional)</Label>
			<FormDatePicker
				id="{idPrefix}dueDate"
				name="dueDate"
				bind:value={form.dueDate}
				placeholder="Select target date"
				class="bg-background max-w-xs"
			/>
		</div>
	</PmFormSection>

	<PmFormSection
		title="Internal notes"
		description="Private context for your team — never shown to clients."
	>
		<Textarea
			id="{idPrefix}notes"
			name="notes"
			bind:value={form.notes}
			rows={4}
			class="bg-background min-h-28 resize-y"
		/>
	</PmFormSection>
</div>
