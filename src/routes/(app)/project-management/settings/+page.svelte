<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import PmDeleteSeedDialog from '$lib/components/project-management/pm-delete-seed-dialog.svelte';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';

	let { data, form } = $props();

	let seeding = $state(false);
	let deletingSeed = $state(false);
	let deleteSeedDialogOpen = $state(false);

	const deleteSeedEnhanceAction: SubmitFunction = () => {
		deletingSeed = true;
		return async ({ result, update }) => {
			deletingSeed = false;
			await update();
			if (result.type === 'success') {
				deleteSeedDialogOpen = false;
				await invalidateAll();
			}
		};
	};

	$effect(() => {
		if (!form?.message) {
			return;
		}

		if (form.message.includes('loaded')) {
			toast.success('Sample data loaded', {
				description: form.message
			});
		} else if (form.message.includes('removed')) {
			toast.success('Sample data removed', {
				description: form.message
			});
		} else {
			toast.error('Sample data action failed', {
				description: form.message
			});
		}
	});
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Project Management"
		title="Settings"
		description="Configure Project Management integration, sample data, and API access."
	/>

	<StatusAlert
		variant="info"
		title="Workspace-scoped projects"
		description="Projects are stored per workspace. Use the /api/v1/project-management endpoints for mobile clients and external integrations."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>Sample data</Card.Title>
			<Card.Description>
				Load demo client projects to explore the module. Sample records are tagged and can be
				removed without affecting your own data.
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			{#if data.seedStatus.seeded}
				<StatusAlert
					variant="success"
					title="Sample data is loaded"
					description="{data.seedStatus.projectCount} sample projects are currently in this workspace."
				/>
			{:else}
				<p class="text-muted-foreground text-sm">
					Loads {data.seedSummary.projectCount} sample client projects across planning, active, on hold,
					and completed statuses.
				</p>
			{/if}

			<div class="flex flex-wrap gap-3">
				{#if data.seedStatus.seeded}
					<Button
						type="button"
						variant="outline"
						disabled={deletingSeed || seeding}
						onclick={() => {
							deleteSeedDialogOpen = true;
						}}
					>
						Remove sample data
					</Button>
				{:else}
					<form
						method="POST"
						action="?/seed"
						use:enhance={() => {
							seeding = true;
							return async ({ result, update }) => {
								seeding = false;
								await update();
								if (result.type === 'success') {
									await invalidateAll();
								}
							};
						}}
					>
						<Button type="submit" disabled={seeding || deletingSeed}>
							{#if seeding}
								<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
								Loading…
							{:else}
								Load sample data
							{/if}
						</Button>
					</form>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>API access</Card.Title>
			<Card.Description>
				Mobile and external clients can use Bearer JWT auth against the Project Management API.
			</Card.Description>
		</Card.Header>
		<Card.Content class="text-muted-foreground space-y-2 text-sm">
			<p>Status probe: <code class="text-foreground">GET /api/v1/project-management/status</code></p>
			<p>Sample data: <code class="text-foreground">GET/POST/DELETE /api/v1/project-management/seed</code></p>
			<p>Projects: <code class="text-foreground">GET/POST /api/v1/project-management/projects</code></p>
			<p>
				Project detail:
				<code class="text-foreground">GET/PATCH /api/v1/project-management/projects/:id</code>
			</p>
		</Card.Content>
	</Card.Root>
</div>

{#if data.seedStatus.seeded}
	<PmDeleteSeedDialog
		bind:open={deleteSeedDialogOpen}
		projectCount={data.seedStatus.projectCount}
		submitting={deletingSeed}
		enhanceAction={deleteSeedEnhanceAction}
	/>
{/if}
