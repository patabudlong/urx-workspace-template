<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
</script>

<Card.Root class="min-h-0 flex-1 rounded-none" aria-busy="true" aria-label="Loading messages">
	<Card.Content class="space-y-0 p-0">
		<div class="flex flex-col gap-0.5 px-2 py-1.5 lg:px-3">
			{#each Array.from({ length: 8 }) as _, index (index)}
				<div class="flex gap-3 rounded-md px-2.5 py-3">
					<Skeleton class="size-9 shrink-0 rounded-full" />
					<div class="min-w-0 flex-1 space-y-2">
						<div class="flex items-center justify-between gap-2">
							<Skeleton class="h-3.5 flex-1" style="max-width: {45 + (index % 3) * 10}%;" />
							<Skeleton class="h-3 w-10 shrink-0" />
						</div>
						<Skeleton class="h-3.5 w-4/5 max-w-xs" />
						<Skeleton class="h-3 w-full max-w-sm" />
					</div>
				</div>
			{/each}
		</div>
	</Card.Content>
</Card.Root>
