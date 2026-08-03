<script lang="ts">
	import InviteRoleCombobox from '$lib/components/team/invite-role-combobox.svelte';
	import TeamLearnAboutRolesLink from '$lib/components/team/team-learn-about-roles-link.svelte';
	import UserAvatar from '$lib/components/user-avatar.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		findTeamInviteRoleOption,
		type TeamInviteRole
	} from '$lib/shared/team/invite-roles';
	import { getWorkspaceMemberRoleLabel } from '$lib/shared/team/member-roles';
	import { cn } from '$lib/utils.js';
	import { enhance } from '$app/forms';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import type { SubmitFunction } from '@sveltejs/kit';

	export type EditTeamMemberTarget = {
		id: string;
		name: string;
		email: string;
		avatarUrl: string | null;
		initials: string;
		role: string;
		roleLabel: string;
	};

	let {
		open = $bindable(false),
		member = null,
		submitting = false,
		enhanceAction
	}: {
		open?: boolean;
		member?: EditTeamMemberTarget | null;
		submitting?: boolean;
		enhanceAction: SubmitFunction;
	} = $props();

	let selectedRole = $state<TeamInviteRole>('member');

	const selectedRoleDescription = $derived(
		findTeamInviteRoleOption(selectedRole)?.description ??
			'Choose the access level for this teammate.'
	);

	const roleChanged = $derived(member ? selectedRole !== member.role : false);

	$effect(() => {
		if (open && member) {
			selectedRole = member.role as TeamInviteRole;
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md" showCloseButton={false}>
		<Dialog.Header>
			<Dialog.Title>Edit member</Dialog.Title>
			<Dialog.Description>
				Update this teammate's workspace role. Name and email are managed from their account
				settings.
			</Dialog.Description>
		</Dialog.Header>

		{#if member}
			<div class="space-y-5">
				<div class="bg-muted/30 flex items-center gap-3 rounded-lg border px-4 py-3">
					<UserAvatar
						avatarUrl={member.avatarUrl}
						initials={member.initials}
						class="size-10"
					/>
					<div class="min-w-0">
						<p class="truncate font-medium">{member.name}</p>
						<p class="text-muted-foreground truncate text-sm">{member.email}</p>
					</div>
				</div>

				<div class="space-y-2">
					<Label for="edit-member-role">Role</Label>
					<InviteRoleCombobox id="edit-member-role" bind:value={selectedRole} disabled={submitting} />
					<p class="text-muted-foreground text-sm leading-relaxed">{selectedRoleDescription}</p>
					<TeamLearnAboutRolesLink />
				</div>

				{#if !roleChanged}
					<p class="text-muted-foreground text-sm">
						Current role: {getWorkspaceMemberRoleLabel(member.role)}. Choose a different role to save
						changes.
					</p>
				{/if}
			</div>
		{/if}

		<Dialog.Footer class="flex-row justify-end gap-2 sm:justify-end">
			<Button variant="outline" type="button" disabled={submitting} onclick={() => (open = false)}>
				Cancel
			</Button>
			{#if member}
				<form method="POST" action="?/update" use:enhance={enhanceAction} class="contents">
					<input type="hidden" name="memberId" value={member.id} />
					<input type="hidden" name="role" value={selectedRole} />
					<Button
						type="submit"
						disabled={submitting || !roleChanged}
						class={cn(submitting && 'pointer-events-none cursor-wait')}
					>
						{#if submitting}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							Saving…
						{:else}
							Save changes
						{/if}
					</Button>
				</form>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
