<script lang="ts">
	import {
		PM_PROJECT_TYPE_OPTIONS,
		PM_PROJECT_TYPES,
		type PmProjectType
	} from '$lib/shared/project-management/project-types';
	import { cn } from '$lib/utils.js';

	let {
		selectedTypes = $bindable<PmProjectType[]>([]),
		inputName = 'projectTypes',
		required = true,
		idPrefix = ''
	}: {
		selectedTypes?: PmProjectType[];
		inputName?: string;
		required?: boolean;
		idPrefix?: string;
	} = $props();

	const typeHints: Record<PmProjectType, string> = {
		[PM_PROJECT_TYPES.WEBSITE]: 'Sites and landing pages',
		[PM_PROJECT_TYPES.PROJECT]: 'General delivery work',
		[PM_PROJECT_TYPES.SOFTWARE]: 'Apps and platforms',
		[PM_PROJECT_TYPES.DEVELOPMENT]: 'Build and engineering',
		[PM_PROJECT_TYPES.BRANDING]: 'Identity and design',
		[PM_PROJECT_TYPES.MARKETING]: 'Campaigns and growth',
		[PM_PROJECT_TYPES.CONSULTING]: 'Advisory engagements',
		[PM_PROJECT_TYPES.OTHER]: 'Anything else'
	};

	function toggleType(type: PmProjectType) {
		if (selectedTypes.includes(type)) {
			selectedTypes = selectedTypes.filter((entry) => entry !== type);
			return;
		}

		selectedTypes = [...selectedTypes, type];
	}
</script>

{#each selectedTypes as type (type)}
	<input type="hidden" name={inputName} value={type} />
{/each}

<fieldset class="space-y-3">
	<legend class="text-sm font-medium" id="{idPrefix}project-types-label">
		Project types{#if required}<span class="text-destructive"> *</span>{/if}
	</legend>
	<p class="text-muted-foreground text-sm">
		Choose everything this engagement includes. Clients will see these on onboarding.
	</p>
	<div
		class="grid gap-2 sm:grid-cols-2"
		role="group"
		aria-labelledby="{idPrefix}project-types-label"
	>
		{#each PM_PROJECT_TYPE_OPTIONS as option (option.value)}
			{@const checked = selectedTypes.includes(option.value)}
			<button
				type="button"
				class={cn(
					'w-full rounded-xl border p-3 text-left transition-all',
					checked
						? 'border-primary bg-primary/10 ring-primary/15 shadow-sm ring-2'
						: 'hover:bg-muted/50 border-border bg-background'
				)}
				aria-pressed={checked}
				onclick={() => toggleType(option.value)}
			>
				<span class="block text-sm font-medium">{option.label}</span>
				<span class="text-muted-foreground mt-1 block text-xs">{typeHints[option.value]}</span>
			</button>
		{/each}
	</div>
</fieldset>
