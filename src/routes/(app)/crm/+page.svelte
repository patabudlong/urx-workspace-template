<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import UsersIcon from '@lucide/svelte/icons/users';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import HandshakeIcon from '@lucide/svelte/icons/handshake';

	let { data } = $props();

	let contactCount = $state<number | null>(null);
	let companyCount = $state<number | null>(null);
	let dealCount = $state<number | null>(null);
	let openDealCount = $state<number | null>(null);

	function resolvePromise<T>(value: Promise<T> | T, setter: (next: T) => void) {
		if (typeof value === 'object' && value !== null && 'then' in value) {
			setter(null as T);
			void (value as Promise<T>).then(setter);
			return;
		}

		setter(value as T);
	}

	$effect(() => {
		resolvePromise(data.contactCount, (value) => {
			contactCount = value;
		});
		resolvePromise(data.companyCount, (value) => {
			companyCount = value;
		});
		resolvePromise(data.dealCount, (value) => {
			dealCount = value;
		});
		resolvePromise(data.openDealCount, (value) => {
			openDealCount = value;
		});
	});
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="CRM"
		title="Overview"
		description="Track contacts, companies, and deals to manage customer relationships in your workspace."
	>
		{#snippet actions()}
			<Button href="/crm/contacts" variant="outline" class="h-10">Contacts</Button>
			<Button href="/crm/deals" class="h-10">
				<HandshakeIcon class="size-4" aria-hidden="true" />
				View deals
			</Button>
		{/snippet}
	</PageHeader>

	<div class="grid gap-6 md:grid-cols-3">
		<Card.Root>
			<Card.Header>
				<Card.Title>Contacts</Card.Title>
				<Card.Description>People you work with across accounts.</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if contactCount === null}
					<Skeleton class="h-9 w-16" />
				{:else}
					<p class="text-3xl font-semibold tracking-tight">{contactCount}</p>
				{/if}
			</Card.Content>
			<Card.Footer>
				<Button href="/crm/contacts" variant="outline" size="sm">
					<UsersIcon class="size-4" />
					View contacts
				</Button>
			</Card.Footer>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Companies</Card.Title>
				<Card.Description>Organizations linked to your pipeline.</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if companyCount === null}
					<Skeleton class="h-9 w-16" />
				{:else}
					<p class="text-3xl font-semibold tracking-tight">{companyCount}</p>
				{/if}
			</Card.Content>
			<Card.Footer>
				<Button href="/crm/companies" variant="outline" size="sm">
					<Building2Icon class="size-4" />
					View companies
				</Button>
			</Card.Footer>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Open deals</Card.Title>
				<Card.Description>
					{#if dealCount === null}
						Active opportunities in your pipeline.
					{:else}
						{openDealCount ?? 0} open of {dealCount} total deals.
					{/if}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if openDealCount === null}
					<Skeleton class="h-9 w-16" />
				{:else}
					<p class="text-3xl font-semibold tracking-tight">{openDealCount}</p>
				{/if}
			</Card.Content>
			<Card.Footer>
				<Button href="/crm/deals" variant="outline" size="sm">View deals</Button>
			</Card.Footer>
		</Card.Root>
	</div>
</div>
