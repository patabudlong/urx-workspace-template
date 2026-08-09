<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { cn } from '$lib/utils.js';
	import { enhance } from '$app/forms';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import type { SubmitFunction } from '@sveltejs/kit';

	export type RemoveTeamMemberTarget = {
		id: string;
		name: string;
		email: string;
		roleLabel: string;
	};

	let {
		open = $bindable(false),
		member = null,
		submitting = false,
		enhanceAction
	}: {
		open?: boolean;
		member?: RemoveTeamMemberTarget | null;
		submitting?: boolean;
		enhanceAction: SubmitFunction;
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content showCloseButton={false}>
		<Dialog.Header>
			<Dialog.Title>Remove member?</Dialog.Title>
			<Dialog.Description>
				{#if member}
					<span class="text-foreground font-medium">{member.name}</span>
					<span class="text-muted-foreground"> ({member.email})</span>
					will lose access to this workspace. Their role was {member.roleLabel}.
				{:else}
					This member will lose access to this workspace.
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer class="flex-row justify-end gap-2 sm:justify-end">
			<Button variant="outline" type="button" disabled={submitting} onclick={() => (open = false)}>
				Cancel
			</Button>
			{#if member}
				<form method="POST" action="?/remove" use:enhance={enhanceAction} class="contents">
					<input type="hidden" name="memberId" value={member.id} />
					<Button
						type="submit"
						variant="destructive"
						disabled={submitting}
						class={cn(submitting && 'pointer-events-none cursor-wait')}
					>
						{#if submitting}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							Removing…
						{:else}
							Remove member
						{/if}
					</Button>
				</form>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
