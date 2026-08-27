<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		CRM_DEAL_UPDATED_MESSAGE,
		CRM_DEAL_UPDATE_FAILED_MESSAGE
	} from '$lib/shared/crm/messages';
	import { CRM_DEAL_STAGES } from '$lib/shared/models/crm-deal';
	import { crmDealStageFormSchema } from '$lib/shared/crm/schemas';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let submitting = $state(false);

	const stageLabels: Record<string, string> = {
		[CRM_DEAL_STAGES.LEAD]: 'Lead',
		[CRM_DEAL_STAGES.QUALIFIED]: 'Qualified',
		[CRM_DEAL_STAGES.PROPOSAL]: 'Proposal',
		[CRM_DEAL_STAGES.NEGOTIATION]: 'Negotiation',
		[CRM_DEAL_STAGES.WON]: 'Won',
		[CRM_DEAL_STAGES.LOST]: 'Lost'
	};

	const superform = superForm(untrack(() => data.stageForm), {
		validators: zod4Client(crmDealStageFormSchema),
		resetForm: false,
		onSubmit: () => {
			submitting = true;
		},
		onUpdated: async ({ form }) => {
			submitting = false;
			if (form.message === CRM_DEAL_UPDATED_MESSAGE) {
				await invalidateAll();
			}
		},
		onError: () => {
			submitting = false;
		}
	});

	const { enhance, form, message: formMessage } = superform;

	function formatValue(): string | null {
		if (data.deal.value === null) {
			return null;
		}

		return new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency: data.deal.currency
		}).format(data.deal.value);
	}

	function formatDate(value: string | null): string {
		if (!value) {
			return '—';
		}

		return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
	}

	function stageVariant(stage: string): 'secondary' | 'default' | 'destructive' {
		if (stage === CRM_DEAL_STAGES.WON) {
			return 'default';
		}

		if (stage === CRM_DEAL_STAGES.LOST) {
			return 'destructive';
		}

		return 'secondary';
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="CRM"
		title={data.deal.title}
		description={data.deal.notes || 'Deal details and pipeline stage.'}
	>
		{#snippet actions()}
			<Button href="/crm/deals" variant="outline" class="h-10">
				<ArrowLeftIcon class="size-4" aria-hidden="true" />
				Back to deals
			</Button>
		{/snippet}
	</PageHeader>

	{#if typeof $formMessage === 'string' && $formMessage.length > 0}
		<StatusAlert
			variant={$formMessage === CRM_DEAL_UPDATED_MESSAGE ? 'success' : 'danger'}
			title={$formMessage === CRM_DEAL_UPDATED_MESSAGE ? 'Deal updated' : 'Could not update deal'}
			description={$formMessage === CRM_DEAL_UPDATE_FAILED_MESSAGE
				? CRM_DEAL_UPDATE_FAILED_MESSAGE
				: $formMessage}
		/>
	{/if}

	<div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
		<Card.Root>
			<Card.Header>
				<Card.Title>Overview</Card.Title>
			</Card.Header>
			<Card.Content class="grid gap-4 sm:grid-cols-2">
				<div>
					<p class="text-muted-foreground text-sm">Stage</p>
					<Badge variant={stageVariant(data.deal.stage)} class="mt-1 capitalize">
						{stageLabels[data.deal.stage] ?? data.deal.stage}
					</Badge>
				</div>
				<div>
					<p class="text-muted-foreground text-sm">Value</p>
					<p class="font-medium">{formatValue() ?? '—'}</p>
				</div>
				<div>
					<p class="text-muted-foreground text-sm">Expected close</p>
					<p class="font-medium">{formatDate(data.deal.expectedCloseDate)}</p>
				</div>
				<div>
					<p class="text-muted-foreground text-sm">Created</p>
					<p class="font-medium">{formatDate(data.deal.createdAt)}</p>
				</div>
				<div>
					<p class="text-muted-foreground text-sm">Contact</p>
					<p class="font-medium">
						{#if data.contact}
							{data.contact.firstName} {data.contact.lastName}
						{:else}
							—
						{/if}
					</p>
				</div>
				<div>
					<p class="text-muted-foreground text-sm">Company</p>
					<p class="font-medium">{data.company?.name ?? '—'}</p>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Update stage</Card.Title>
				<Card.Description>Move this deal through your pipeline.</Card.Description>
			</Card.Header>
			<Card.Content>
				<form method="POST" action="?/updateStage" use:enhance class="space-y-4">
					<div class="space-y-2">
						<Label for="stage">Stage</Label>
						<select
							id="stage"
							name="stage"
							class="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
							bind:value={$form.stage}
						>
							{#each Object.values(CRM_DEAL_STAGES) as stage (stage)}
								<option value={stage}>{stageLabels[stage]}</option>
							{/each}
						</select>
					</div>

					<Button type="submit" class="h-10 w-full" disabled={submitting}>
						{#if submitting}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							Saving...
						{:else}
							Save stage
						{/if}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>
	</div>
</div>
