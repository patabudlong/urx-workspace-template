<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import ListSearchInput from '$lib/components/list/list-search-input.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import type { CrmContactDto } from '$lib/shared/models/crm-contact';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import { page } from '$app/state';

	let { data } = $props();

	let contacts = $state<CrmContactDto[] | null>(null);
	let searchQuery = $state('');

	$effect(() => {
		searchQuery = data.search ?? '';
	});

	$effect(() => {
		const nextContacts = data.contacts as Promise<CrmContactDto[]> | CrmContactDto[];

		if (Array.isArray(nextContacts)) {
			contacts = nextContacts;
		} else if (nextContacts && typeof nextContacts.then === 'function') {
			contacts = null;
			void nextContacts.then((resolved) => {
				contacts = resolved;
			});
		} else {
			contacts = [];
		}
	});

	function formatName(contact: CrmContactDto): string {
		return `${contact.firstName} ${contact.lastName}`.trim();
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
		url.searchParams.delete('created');
		window.location.href = url.toString();
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="CRM"
		title="Contacts"
		description="People linked to your customer relationships."
	>
		{#snippet actions()}
			<Button href="/crm/contacts/new" class="h-10">
				<UserPlusIcon class="size-4" aria-hidden="true" />
				Add contact
			</Button>
		{/snippet}
	</PageHeader>

	{#if data.created}
		<StatusAlert
			variant="success"
			title="Contact created"
			description="The new contact is now available in your workspace."
		/>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>All contacts</Card.Title>
			<Card.Description>Search by name, email, or phone.</Card.Description>
			<Card.Action>
				<form class="flex gap-2" onsubmit={(event) => { event.preventDefault(); applySearch(); }}>
					<ListSearchInput
						bind:value={searchQuery}
						placeholder="Search contacts..."
						ariaLabel="Search contacts"
					/>
				</form>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			{#if contacts === null}
				<div class="space-y-3">
					<Skeleton class="h-16 w-full" />
					<Skeleton class="h-16 w-full" />
					<Skeleton class="h-16 w-full" />
				</div>
			{:else if contacts.length === 0}
				<p class="text-muted-foreground text-sm">No contacts yet.</p>
				<div class="mt-4">
					<Button href="/crm/contacts/new" size="sm">Add your first contact</Button>
				</div>
			{:else}
				<ul class="divide-border divide-y">
					{#each contacts as contact (contact.id)}
						<li class="flex flex-col gap-1 py-4 first:pt-0 last:pb-0">
							<p class="font-medium">{formatName(contact)}</p>
							{#if contact.title}
								<p class="text-muted-foreground text-sm">{contact.title}</p>
							{/if}
							<div class="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
								{#if contact.email}
									<span>{contact.email}</span>
								{/if}
								{#if contact.phone}
									<span>{contact.phone}</span>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
