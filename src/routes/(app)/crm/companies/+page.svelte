<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import ListSearchInput from '$lib/components/list/list-search-input.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import type { CrmCompanyDto } from '$lib/shared/models/crm-company';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import { page } from '$app/state';

	let { data } = $props();

	let companies = $state<CrmCompanyDto[] | null>(null);
	let searchQuery = $state('');

	$effect(() => {
		searchQuery = data.search ?? '';
	});

	$effect(() => {
		const nextCompanies = data.companies as Promise<CrmCompanyDto[]> | CrmCompanyDto[];

		if (Array.isArray(nextCompanies)) {
			companies = nextCompanies;
		} else if (nextCompanies && typeof nextCompanies.then === 'function') {
			companies = null;
			void nextCompanies.then((resolved) => {
				companies = resolved;
			});
		} else {
			companies = [];
		}
	});

	function applySearch() {
		const url = new URL(page.url);
		const trimmed = searchQuery.trim();

		if (trimmed) {
			url.searchParams.set('search', trimmed);
		} else {
			url.searchParams.delete('search');
		}

		url.searchParams.delete('page');
		url.searchParams.delete('created');
		window.location.href = url.toString();
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="CRM"
		title="Companies"
		description="Organizations in your customer relationship pipeline."
	>
		{#snippet actions()}
			<Button href="/crm/companies/new" class="h-10">
				<Building2Icon class="size-4" aria-hidden="true" />
				Add company
			</Button>
		{/snippet}
	</PageHeader>

	{#if data.created}
		<StatusAlert
			variant="success"
			title="Company created"
			description="The new company is now available in your workspace."
		/>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>All companies</Card.Title>
			<Card.Description>Search by name, domain, or industry.</Card.Description>
			<Card.Action>
				<form class="flex gap-2" onsubmit={(event) => { event.preventDefault(); applySearch(); }}>
					<ListSearchInput
						bind:value={searchQuery}
						placeholder="Search companies..."
						ariaLabel="Search companies"
					/>
				</form>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			{#if companies === null}
				<div class="space-y-3">
					<Skeleton class="h-16 w-full" />
					<Skeleton class="h-16 w-full" />
					<Skeleton class="h-16 w-full" />
				</div>
			{:else if companies.length === 0}
				<p class="text-muted-foreground text-sm">No companies yet.</p>
				<div class="mt-4">
					<Button href="/crm/companies/new" size="sm">Add your first company</Button>
				</div>
			{:else}
				<ul class="divide-border divide-y">
					{#each companies as company (company.id)}
						<li class="flex flex-col gap-1 py-4 first:pt-0 last:pb-0">
							<p class="font-medium">{company.name}</p>
							<div class="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
								{#if company.industry}
									<span>{company.industry}</span>
								{/if}
								{#if company.domain}
									<span>{company.domain}</span>
								{/if}
								{#if company.phone}
									<span>{company.phone}</span>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
