<script lang="ts">
	let {
		workspaceName,
		class: className = ''
	}: {
		workspaceName: string;
		class?: string;
	} = $props();
</script>

<div class="text-right {className}">
	<p class="truncate text-base font-semibold">{workspaceName}</p>
</div>
