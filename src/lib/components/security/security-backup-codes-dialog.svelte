<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	let {
		open = $bindable(false),
		backupCodes = $bindable<string[]>([])
	}: {
		open?: boolean;
		backupCodes?: string[];
	} = $props();

	let copied = $state(false);

	const codesText = $derived(backupCodes.join('\n'));

	function downloadCodes() {
		const blob = new Blob([`Urixoft Workspace backup codes\n\n${codesText}\n`], {
			type: 'text/plain'
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'urixoft-backup-codes.txt';
		link.click();
		URL.revokeObjectURL(url);
	}

	async function copyCodes() {
		await navigator.clipboard.writeText(codesText);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}

	$effect(() => {
		if (!open) {
			copied = false;
		}
	});
</script>

<Dialog.Root bind:open onOpenChange={(value) => !value && (backupCodes = [])}>
	<Dialog.Content class="gap-0 overflow-hidden p-0 sm:max-w-md">
		<div class="border-b px-6 pt-8 pb-6">
			<Dialog.Header class="space-y-2">
				<Dialog.Title>Save your backup codes</Dialog.Title>
				<Dialog.Description>
					Store these codes somewhere safe. Each code can be used once if you lose access to your
					verification methods.
				</Dialog.Description>
			</Dialog.Header>
		</div>

		<div class="space-y-4 px-6 py-6">
			<div class="bg-muted/40 rounded-lg border p-4">
				<ul class="grid grid-cols-2 gap-2 font-mono text-sm">
					{#each backupCodes as code (code)}
						<li>{code}</li>
					{/each}
				</ul>
			</div>

			<div class="flex flex-wrap gap-2">
				<Button type="button" variant="outline" class="h-10" onclick={copyCodes}>
					<CopyIcon class="size-4" aria-hidden="true" />
					{copied ? 'Copied' : 'Copy'}
				</Button>
				<Button type="button" variant="outline" class="h-10" onclick={downloadCodes}>
					<DownloadIcon class="size-4" aria-hidden="true" />
					Download
				</Button>
			</div>

			<Button type="button" class="h-10 w-full" onclick={() => (open = false)}>
				Done
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
