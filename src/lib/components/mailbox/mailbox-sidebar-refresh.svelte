<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { cn } from '$lib/utils.js';
	import { invalidate } from '$app/navigation';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';

	let {
		configured = true,
		class: className
	}: {
		configured?: boolean;
		class?: string;
	} = $props();

	let refreshing = $state(false);

	async function refresh() {
		if (refreshing || !configured) {
			return;
		}

		refreshing = true;
		try {
			await Promise.all([invalidate('mailbox:messages'), invalidate('mailbox:folders')]);
		} finally {
			refreshing = false;
		}
	}
</script>

{#if configured}
	<Tooltip.Provider delayDuration={0}>
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						type="button"
						variant="ghost"
						size="icon"
						class={cn('text-muted-foreground size-8 shrink-0', className)}
						aria-label="Refresh mailbox"
						disabled={refreshing}
						onclick={() => void refresh()}
					>
						<RefreshCwIcon
							class={cn('size-4', refreshing && 'animate-spin')}
							aria-hidden="true"
						/>
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content side="bottom">Refresh</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
{/if}
