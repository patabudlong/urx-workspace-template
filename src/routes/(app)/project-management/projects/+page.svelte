<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import ListSearchInput from '$lib/components/list/list-search-input.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import type { PmProjectDto } from '$lib/shared/models/pm-project';
	import { PM_PROJECT_DELETED_MESSAGE } from '$lib/shared/project-management/messages';
	import { getPmProjectTypeLabel } from '$lib/shared/project-management/project-types';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';

	type PaginationState = {
		page: number;
		limit: number;
		total: number;
		hasMore: boolean;
	};

	let { data } = $props();

	let projects = $state<PmProjectDto[] | null>(null);
	let pagination = $state<PaginationState | null>(null);
	let searchQuery = $state('');

	const statusLabels: Record<PmProjectDto['status'], string> = {
		planning: 'Planning',
		active: 'Active',
		on_hold: 'On hold',
		completed: 'Completed',
		cancelled: 'Cancelled'
	};

	const pageQuery = $derived.by(() => {
		const trimmed = data.search?.trim();
		return trimmed ? `&search=${encodeURIComponent(trimmed)}` : '';
	});

	const rangeStart = $derived(
		pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0
	);
	const rangeEnd = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

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

	$effect(() => {
		const nextPagination = data.pagination as Promise<PaginationState> | PaginationState;

		if (nextPagination && typeof nextPagination === 'object' && 'page' in nextPagination) {
			pagination = nextPagination;
		} else if (nextPagination && typeof nextPagination.then === 'function') {
			pagination = null;
			void nextPagination.then((resolved) => {
				pagination = resolved;
			});
		} else {
			pagination = null;
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

	$effect(() => {
		if (page.url.searchParams.get('deleted') === '1') {
			toast.success('Project deleted', { description: PM_PROJECT_DELETED_MESSAGE });
		}
	});
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Project Management"
		title="Projects"
		description="Client projects from kickoff through delivery."
	>
		{#snippet actions()}
			<Button href="/project-management/projects/new" class="h-10">
				<ClipboardListIcon class="size-4" aria-hidden="true" />
				New project
			</Button>
		{/snippet}
	</PageHeader>

	{#if page.url.searchParams.get('deleted') === '1'}
		<StatusAlert variant="success" title="Project deleted" description={PM_PROJECT_DELETED_MESSAGE} />
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>Workspace projects</Card.Title>
			<Card.Description>Search by title, client, project URL, or notes.</Card.Description>
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
								{#if project.projectUrl}
									· {project.projectUrl}
								{/if}
							</p>
							<div class="mt-2 flex flex-wrap gap-1.5">
								{#each project.projectTypes as projectType (projectType)}
									<Badge variant="outline" class="text-xs font-normal">
										{getPmProjectTypeLabel(projectType)}
									</Badge>
								{/each}
							</div>
						</div>
						<Badge variant={statusVariant(project.status)}>{statusLabels[project.status]}</Badge>
					</a>
				{/each}
			{/if}
		</Card.Content>
		{#if pagination && pagination.total > pagination.limit}
			<Card.Footer class="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
				<p class="text-muted-foreground text-sm">
					Showing {rangeStart}–{rangeEnd} of {pagination.total}
				</p>
				<div class="flex items-center gap-2">
					{#if pagination.page > 1}
						<Button
							href="/project-management/projects?page={pagination.page - 1}{pageQuery}"
							variant="outline"
							size="sm"
							class="h-8"
						>
							<ChevronLeftIcon class="size-4" aria-hidden="true" />
							Previous
						</Button>
					{/if}
					{#if pagination.hasMore}
						<Button
							href="/project-management/projects?page={pagination.page + 1}{pageQuery}"
							variant="outline"
							size="sm"
							class="h-8"
						>
							Next
							<ChevronRightIcon class="size-4" aria-hidden="true" />
						</Button>
					{/if}
				</div>
			</Card.Footer>
		{/if}
	</Card.Root>
</div>
