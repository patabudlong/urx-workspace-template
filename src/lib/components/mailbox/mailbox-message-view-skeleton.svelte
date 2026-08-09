<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';

	let { layout = 'card' }: { layout?: 'card' | 'panel' } = $props();
</script>

{#if layout === 'panel'}
	<div aria-busy="true" aria-label="Loading message">
		<header class="border-border space-y-3 border-b p-4 sm:p-6">
			<Skeleton class="h-7 w-3/5 max-w-md" />
			<div class="space-y-2">
				<Skeleton class="h-4 w-2/5 max-w-xs" />
				<Skeleton class="h-4 w-1/2 max-w-sm" />
				<Skeleton class="h-4 w-28" />
			</div>
		</header>
		<div class="space-y-3 p-4 sm:p-6">
			{#each Array.from({ length: 6 }) as _, index (index)}
				<Skeleton class="h-4 w-full" style="max-width: {88 - (index % 3) * 12}%;" />
			{/each}
		</div>
	</div>
{:else}
	<div class="flex min-h-0 flex-col gap-4" aria-busy="true" aria-label="Loading message">
		<Skeleton class="h-9 w-28" />

		<Card.Root class="min-h-0 flex-1">
			<Card.Header class="space-y-3">
				<Skeleton class="h-7 w-3/5 max-w-md" />
				<div class="space-y-2">
					<Skeleton class="h-4 w-2/5 max-w-xs" />
					<Skeleton class="h-4 w-1/2 max-w-sm" />
					<Skeleton class="h-4 w-28" />
				</div>
			</Card.Header>
			<Separator />
			<Card.Content class="space-y-3 py-6">
				{#each Array.from({ length: 6 }) as _, index (index)}
					<Skeleton class="h-4 w-full" style="max-width: {88 - (index % 3) * 12}%;" />
				{/each}
			</Card.Content>
		</Card.Root>
	</div>
{/if}
