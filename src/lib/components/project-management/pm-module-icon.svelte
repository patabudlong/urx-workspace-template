<script lang="ts">
	import AppIcon from '$lib/components/app-icon.svelte';
	import { SOLAR } from '$lib/icons/solar-icons';

	let { class: className }: { class?: string } = $props();
</script>

<AppIcon icon={SOLAR.projectManagement} class={className} size="lg" aria-hidden="true" />
