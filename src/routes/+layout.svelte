<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import '../routes/layout.css';

	let { children } = $props();
</script>

<ModeWatcher />

{@render children()}
