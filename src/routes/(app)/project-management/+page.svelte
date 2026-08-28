<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import LayersIcon from '@lucide/svelte/icons/layers';

	let { data } = $props();

	let projectCount = $state<number | null>(null);
	let activeProjectCount = $state<number | null>(null);

	function resolvePromise<T>(value: Promise<T> | T, setter: (next: T) => void) {
		if (typeof value === 'object' && value !== null && 'then' in value) {
			setter(null as T);
			void (value as Promise<T>).then(setter);
			return;
		}

		setter(value as T);
	}

	$effect(() => {
		resolvePromise(data.projectCount, (value) => {
			projectCount = value;
		});
		resolvePromise(data.activeProjectCount, (value) => {
			activeProjectCount = value;
		});
	});
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Project Management"
		title="Overview"
		description="Plan client website projects, track delivery status, and coordinate onboarding follow-ups."
	>
		{#snippet actions()}
			<Button href="/project-management/projects" variant="outline" class="h-10">Projects</Button>
			<Button href="/project-management/projects/new" class="h-10">
				<ClipboardListIcon class="size-4" aria-hidden="true" />
				New project
			</Button>
		{/snippet}
	</PageHeader>

	<div class="grid gap-6 md:grid-cols-2">
		<Card.Root>
			<Card.Header>
				<Card.Title>All projects</Card.Title>
				<Card.Description>Client website and delivery projects in this workspace.</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if projectCount === null}
					<Skeleton class="h-9 w-16" />
				{:else}
					<p class="text-3xl font-semibold tracking-tight">{projectCount}</p>
				{/if}
			</Card.Content>
			<Card.Footer>
				<Button href="/project-management/projects" variant="outline" size="sm">
					<LayersIcon class="size-4" />
					View projects
				</Button>
			</Card.Footer>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Active projects</Card.Title>
				<Card.Description>Projects in planning or active delivery.</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if activeProjectCount === null}
					<Skeleton class="h-9 w-16" />
				{:else}
					<p class="text-3xl font-semibold tracking-tight">{activeProjectCount}</p>
				{/if}
			</Card.Content>
			<Card.Footer>
				<Button href="/project-management/projects" variant="outline" size="sm">View active</Button>
			</Card.Footer>
		</Card.Root>
	</div>
</div>
