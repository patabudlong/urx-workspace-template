<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import ListSearchInput from '$lib/components/list/list-search-input.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import type { PmProjectDto } from '$lib/shared/models/pm-project';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import { page } from '$app/state';

	let { data } = $props();

	let projects = $state<PmProjectDto[] | null>(null);
	let searchQuery = $state('');

	const statusLabels: Record<PmProjectDto['status'], string> = {
		planning: 'Planning',
		active: 'Active',
		on_hold: 'On hold',
		completed: 'Completed',
		cancelled: 'Cancelled'
	};

	$effect(() => {
		searchQuery = data.search ?? '';
	});

	$effect(() => {
		const nextProjects = data.projects as Promise<PmProjectDto[]> | PmProjectDto[];

		if (Array.isArray(nextProjects)) {
			projects = nextProjects;
		} else if (nextProjects && typeof nextProjects.then === 'function') {
			projects = null;
			void nextProjects.then((resolved) => {
				projects = resolved;
			});
		} else {
			projects = [];
		}
	});

	function statusVariant(status: PmProjectDto['status']): 'secondary' | 'default' | 'destructive' {
		if (status === 'completed') {
			return 'default';
		}

		if (status === 'cancelled') {
			return 'destructive';
		}

		return 'secondary';
	}

	function applySearch() {
		const url = new URL(page.url);
		const trimmed = searchQuery.trim();

		if (trimmed) {
			url.searchParams.set('search', trimmed);
		} else {
			url.searchParams.delete('search');
		}

		url.searchParams.delete('page');
		window.location.href = url.toString();
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Project Management"
		title="Projects"
		description="Client website projects from kickoff through launch."
	>
		{#snippet actions()}
			<Button href="/project-management/projects/new" class="h-10">
				<ClipboardListIcon class="size-4" aria-hidden="true" />
				New project
			</Button>
		{/snippet}
	</PageHeader>

	<Card.Root>
		<Card.Header>
			<Card.Title>Workspace projects</Card.Title>
			<Card.Description>Search by title, client, website URL, or notes.</Card.Description>
			<Card.Action>
				<form
					class="flex items-center gap-2"
					onsubmit={(event) => {
						event.preventDefault();
						applySearch();
					}}
				>
					<ListSearchInput
						bind:value={searchQuery}
						placeholder="Search projects..."
						ariaLabel="Search projects"
					/>
				</form>
			</Card.Action>
		</Card.Header>
		<Card.Content class="space-y-3">
			{#if projects === null}
				{#each Array.from({ length: 4 }) as _, index (index)}
					<Skeleton class="h-16 w-full" />
				{/each}
			{:else if projects.length === 0}
				<p class="text-muted-foreground text-sm">No projects yet. Create your first client project.</p>
			{:else}
				{#each projects as project (project.id)}
					<a
						href="/project-management/projects/{project.id}"
						class="hover:bg-muted/50 flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors"
					>
						<div class="min-w-0">
							<p class="truncate font-medium">{project.title}</p>
							<p class="text-muted-foreground truncate text-sm">
								{project.clientName ?? 'No client assigned'}
								{#if project.websiteUrl}
									· {project.websiteUrl}
								{/if}
							</p>
						</div>
						<Badge variant={statusVariant(project.status)}>{statusLabels[project.status]}</Badge>
					</a>
				{/each}
			{/if}
		</Card.Content>
	</Card.Root>
</div>
