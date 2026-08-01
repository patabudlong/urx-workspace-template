<script lang="ts">
	let { children } = $props();
</script>

<div class="bg-muted/40 min-h-svh">
	{@render children?.()}
</div>
