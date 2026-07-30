<script lang="ts">
	let { children } = $props();
</script>

<div class="bg-background flex min-h-svh flex-col items-center justify-center p-4 md:p-8">
	<div class="w-full max-w-sm">
		{@render children?.()}
	</div>
</div>
