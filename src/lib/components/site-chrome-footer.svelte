<script lang="ts">
	import { APP_NAME } from '$lib/shared/site-meta';

	const year = new Date().getFullYear();
</script>

<footer class="border-border/60 shrink-0 border-t px-4 py-3 sm:px-6">
	<p class="text-muted-foreground text-center text-xs sm:text-sm">
		© {year} {APP_NAME}. All rights reserved.
	</p>
</footer>
