<script lang="ts">
	import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';

	const sidebar = useSidebar();
	let desktopOpenBeforeMobile = $state<boolean | null>(null);

	$effect(() => {
		if (sidebar.isMobile) {
			if (desktopOpenBeforeMobile === null) {
				desktopOpenBeforeMobile = sidebar.open;
			}

			sidebar.setOpenMobile(false);
			sidebar.setOpen(false);
			return;
		}

		if (desktopOpenBeforeMobile !== null) {
			sidebar.setOpen(desktopOpenBeforeMobile);
			desktopOpenBeforeMobile = null;
		}
	});
</script>
