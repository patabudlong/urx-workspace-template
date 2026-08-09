<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
</script>

<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
	<div class="min-w-0 space-y-2">
		<Skeleton class="h-4 w-16" />
		<Skeleton class="h-8 w-28" />
		<Skeleton class="h-4 w-full max-w-xl" />
		<Skeleton class="h-4 w-4/5 max-w-lg" />
	</div>
	<div class="flex shrink-0 flex-wrap items-center gap-2">
		<Skeleton class="h-10 w-24" />
		<Skeleton class="h-10 w-32" />
	</div>
</div>
