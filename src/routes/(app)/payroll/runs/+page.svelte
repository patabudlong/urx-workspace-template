<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import type { PayrollRunDto } from '$lib/shared/models/payroll-run';

	let { data } = $props();

	let runs = $state<PayrollRunDto[] | null>(null);

	$effect(() => {
		const next = data.runs as Promise<PayrollRunDto[]> | PayrollRunDto[];

		if (Array.isArray(next)) {
			runs = next;
			return;
		}

		if (!next || typeof next.then !== 'function') {
			runs = [];
			return;
		}

		runs = null;

		void next.then((resolved) => {
			runs = resolved;
		});
	});

	function formatDate(value: string): string {
		return new Intl.DateTimeFormat(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}).format(new Date(value));
	}

	function statusVariant(status: PayrollRunDto['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
		if (status === 'completed') {
			return 'default';
		}

		if (status === 'failed') {
			return 'destructive';
		}

		return 'secondary';
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Payroll"
		title="Pay runs"
		description="Payroll runs for the active workspace. Each run covers a pay period and tracks processing status."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>All pay runs</Card.Title>
			<Card.Description>Most recent pay periods appear first.</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if runs === null}
				<div class="space-y-3" aria-busy="true" aria-label="Loading pay runs">
					{#each Array.from({ length: 4 }) as _, index (index)}
						<Skeleton class="h-14 w-full" />
					{/each}
				</div>
			{:else if runs.length === 0}
				<StatusAlert
					variant="info"
					title="No pay runs yet"
					description="Pay runs you create will appear here with their period dates and status."
				/>
			{:else}
				<ul class="divide-border divide-y">
					{#each runs as run (run.id)}
						<li class="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
							<div class="min-w-0 space-y-1">
								<p class="truncate font-medium">{run.title}</p>
								<p class="text-muted-foreground text-sm">
									{formatDate(run.periodStart)} – {formatDate(run.periodEnd)}
								</p>
							</div>
							<Badge variant={statusVariant(run.status)} class="w-fit capitalize">
								{run.status}
							</Badge>
						</li>
					{/each}
				</ul>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
