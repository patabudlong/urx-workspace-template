<script lang="ts">
	import AppIcon from '$lib/components/app-icon.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { SOLAR } from '$lib/icons/solar-icons';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';

	let {
		icon,
		iconClass,
		title,
		description,
		enabled = false,
		unavailableMessage = null,
		actionLabel = 'Set up',
		actionDisabled = false,
		actionBusy = false,
		onAction
	}: {
		icon: string;
		iconClass: string;
		title: string;
		description: string;
		enabled?: boolean;
		unavailableMessage?: string | null;
		actionLabel?: string;
		actionDisabled?: boolean;
		actionBusy?: boolean;
		onAction?: () => void;
	} = $props();
</script>

<div class="flex h-full flex-col p-4 text-center">
	<div class="flex flex-col items-center gap-3">
		<AppIcon {icon} size="xl" class={iconClass} aria-hidden="true" />
		<div class="space-y-1">
			<p class="text-sm font-medium">{title}</p>
			<p class="text-muted-foreground text-sm leading-relaxed">{description}</p>
		</div>
	</div>

	<div class="mt-auto flex flex-col items-center pt-4">
		{#if enabled}
			<Badge variant="secondary" class="w-fit gap-1">
				<AppIcon icon={SOLAR.security} size="sm" aria-hidden="true" />
				Enabled
			</Badge>
		{:else if unavailableMessage}
			<p class="text-muted-foreground text-xs leading-relaxed">{unavailableMessage}</p>
		{:else}
			<Button
				type="button"
				class="h-10 w-full"
				disabled={actionDisabled || actionBusy}
				onclick={onAction}
			>
				{#if actionBusy}
					<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
				{/if}
				{actionLabel}
			</Button>
		{/if}
	</div>
</div>
