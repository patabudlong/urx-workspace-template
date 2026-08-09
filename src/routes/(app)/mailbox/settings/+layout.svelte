<script lang="ts">
	let { children } = $props();
</script>

<div class="flex max-w-4xl flex-col gap-6">
	{@render children()}
</div>
