<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import BellIcon from '@lucide/svelte/icons/bell';
</script>

<Button variant="ghost" size="icon" aria-label="Notifications">
	<BellIcon class="size-4" />
</Button>
