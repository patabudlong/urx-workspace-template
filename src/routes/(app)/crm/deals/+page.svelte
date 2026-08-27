<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import ListSearchInput from '$lib/components/list/list-search-input.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import type { CrmDealDto } from '$lib/shared/models/crm-deal';
	import HandshakeIcon from '@lucide/svelte/icons/handshake';
	import { page } from '$app/state';

	let { data } = $props();

	let deals = $state<CrmDealDto[] | null>(null);
	let searchQuery = $state('');

	$effect(() => {
		searchQuery = data.search ?? '';
	});

	$effect(() => {
		const nextDeals = data.deals as Promise<CrmDealDto[]> | CrmDealDto[];

		if (Array.isArray(nextDeals)) {
			deals = nextDeals;
		} else if (nextDeals && typeof nextDeals.then === 'function') {
			deals = null;
			void nextDeals.then((resolved) => {
				deals = resolved;
			});
		} else {
			deals = [];
		}
	});

	function formatValue(deal: CrmDealDto): string | null {
		if (deal.value === null) {
			return null;
		}

		return new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency: deal.currency
		}).format(deal.value);
	}

	function stageVariant(stage: CrmDealDto['stage']): 'secondary' | 'default' | 'destructive' {
		if (stage === 'won') {
			return 'default';
		}

		if (stage === 'lost') {
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
		eyebrow="CRM"
		title="Deals"
		description="Opportunities moving through your sales pipeline."
	>
		{#snippet actions()}
			<Button href="/crm/deals/new" class="h-10">
				<HandshakeIcon class="size-4" aria-hidden="true" />
				Add deal
			</Button>
		{/snippet}
	</PageHeader>

	<Card.Root>
		<Card.Header>
			<Card.Title>Pipeline</Card.Title>
			<Card.Description>Search by deal title or notes.</Card.Description>
			<Card.Action>
				<form class="flex gap-2" onsubmit={(event) => { event.preventDefault(); applySearch(); }}>
					<ListSearchInput
						bind:value={searchQuery}
						placeholder="Search deals..."
						ariaLabel="Search deals"
					/>
				</form>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			{#if deals === null}
				<div class="space-y-3">
					<Skeleton class="h-16 w-full" />
					<Skeleton class="h-16 w-full" />
					<Skeleton class="h-16 w-full" />
				</div>
			{:else if deals.length === 0}
				<p class="text-muted-foreground text-sm">No deals yet.</p>
				<div class="mt-4">
					<Button href="/crm/deals/new" size="sm">Add your first deal</Button>
				</div>
			{:else}
				<ul class="divide-border divide-y">
					{#each deals as deal (deal.id)}
						<li class="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<a href="/crm/deals/{deal.id}" class="font-medium hover:underline">
									{deal.title}
								</a>
								<Badge variant={stageVariant(deal.stage)}>{deal.stage}</Badge>
							</div>
							{#if formatValue(deal)}
								<p class="text-muted-foreground text-sm">{formatValue(deal)}</p>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
