<script lang="ts">
	import UserAvatar from '$lib/components/user-avatar.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { buildUserDisplay } from '$lib/shared/user-display';
	import { ACCOUNT_WARNING_BADGE_CLASS } from '$lib/shared/account-ui';
	import { cn } from '$lib/utils.js';
	import type { UserProfile } from '$lib/shared/schemas/account';
	import { formatFullName } from '$lib/shared/user';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import PhoneIcon from '@lucide/svelte/icons/phone';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	let { profile }: { profile: UserProfile } = $props();

	const userDisplay = $derived(
		buildUserDisplay({
			email: profile.email,
			firstName: profile.firstName,
			lastName: profile.lastName,
			avatarUrl: profile.avatarUrl,
			presenceStatus: profile.presenceStatus
		})
	);

	const memberSince = $derived(
		new Intl.DateTimeFormat(undefined, {
			month: 'long',
			year: 'numeric'
		}).format(new Date(profile.createdAt))
	);
</script>

<div class="flex flex-col gap-6 sm:flex-row sm:items-start">
	<UserAvatar
		avatarUrl={userDisplay.avatarUrl}
		initials={userDisplay.initials}
		class="size-20 text-lg sm:size-24 sm:text-xl"
	/>

	<div class="min-w-0 flex-1 space-y-3">
		<div class="space-y-1">
			<h3 class="text-xl font-semibold tracking-tight">
				{formatFullName(profile.firstName, profile.lastName)}
			</h3>
			<p class="text-muted-foreground text-sm">{profile.email}</p>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			{#if profile.emailVerified}
				<Badge variant="secondary" class="gap-1">
					<CircleCheckIcon class="size-3" aria-hidden="true" />
					Email verified
				</Badge>
			{:else}
				<Badge variant="outline" class="gap-1">
					<TriangleAlertIcon class="size-3" aria-hidden="true" />
					Email not verified
				</Badge>
			{/if}

			{#if profile.hasGoogleAccount}
				<Badge variant="outline">Google connected</Badge>
			{/if}

			{#if profile.phoneNumber}
				{#if profile.phoneVerified}
					<Badge variant="secondary" class="gap-1">
						<PhoneIcon class="size-3" aria-hidden="true" />
						Phone verified
					</Badge>
				{:else}
					<Badge variant="outline" class={cn(ACCOUNT_WARNING_BADGE_CLASS, 'gap-1')}>
						<TriangleAlertIcon class="size-3" aria-hidden="true" />
						Phone not verified
					</Badge>
				{/if}
			{/if}
		</div>

		<p class="text-muted-foreground text-sm">Member since {memberSince}</p>
	</div>
</div>
