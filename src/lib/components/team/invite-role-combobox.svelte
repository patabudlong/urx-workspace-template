<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import {
		findTeamInviteRoleOption,
		TEAM_INVITE_ROLE_OPTIONS,
		type TeamInviteRole
	} from '$lib/shared/team/invite-roles';
	import { cn } from '$lib/utils.js';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';

	let {
		value = $bindable<TeamInviteRole>('member'),
		id,
		disabled = false,
		placeholder = 'Select a role',
		'aria-invalid': ariaInvalid
	}: {
		value?: TeamInviteRole;
		id?: string;
		disabled?: boolean;
		placeholder?: string;
		'aria-invalid'?: boolean | 'true' | 'false';
	} = $props();

	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement | null>(null);

	const selectedOption = $derived(findTeamInviteRoleOption(value));

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef?.focus();
		});
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef} {disabled}>
		{#snippet child({ props })}
			<Button
				{...props}
				{id}
				variant="outline"
				role="combobox"
				aria-expanded={open}
				aria-invalid={ariaInvalid}
				{disabled}
				class={cn(
					'h-10 w-full justify-between px-2.5 font-normal',
					!selectedOption && 'text-muted-foreground',
					'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40'
				)}
			>
				<span class="truncate">{selectedOption?.label ?? placeholder}</span>
				<ChevronsUpDownIcon class="ms-2 size-4 shrink-0 opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-(--bits-popover-anchor-width) p-0" align="start" sideOffset={4}>
		<Command.Root class="rounded-lg p-0 shadow-none">
			<Command.Input placeholder="Search roles..." />
			<Command.List>
				<Command.Empty>No roles found.</Command.Empty>
				<Command.Group>
					{#each TEAM_INVITE_ROLE_OPTIONS as option (option.value)}
						<Command.Item
							value={option.label}
							keywords={[option.value, option.description]}
							onSelect={() => {
								value = option.value;
								closeAndFocusTrigger();
							}}
						>
							<div class="flex min-w-0 flex-col gap-0.5 py-0.5">
								<span class="font-medium">{option.label}</span>
								<span class="text-muted-foreground text-xs leading-snug">{option.description}</span>
							</div>
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
