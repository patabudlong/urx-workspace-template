<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
</script>

<Card.Root class="min-h-0 flex-1" aria-busy="true" aria-label="Loading messages">
	<Card.Header class="flex-row items-center justify-between gap-4 space-y-0">
		<div class="space-y-2">
			<Skeleton class="h-6 w-24" />
			<Skeleton class="h-4 w-20" />
		</div>
	</Card.Header>
	<Card.Content class="space-y-0 p-0">
		{#each Array.from({ length: 8 }) as _, index (index)}
			<div class="border-border flex flex-col gap-2 border-b px-4 py-4 last:border-b-0">
				<div class="flex items-center gap-2">
					<Skeleton class="h-4 flex-1" style="max-width: {40 + (index % 4) * 8}%;" />
					<Skeleton class="h-3 w-12 shrink-0" />
				</div>
				<Skeleton class="h-4 w-3/5 max-w-sm" />
				<Skeleton class="h-3 w-full max-w-md" />
			</div>
		{/each}
	</Card.Content>
</Card.Root>
