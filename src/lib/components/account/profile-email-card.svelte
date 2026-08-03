<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { UserProfile } from '$lib/shared/schemas/account';

	let { profile }: { profile: UserProfile } = $props();
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Email address</Card.Title>
		<Card.Description>
			Your sign-in email. Contact support if you need to change it.
		</Card.Description>
	</Card.Header>
	<Card.Content class="max-w-xl space-y-2">
		<div class="space-y-2">
			<Label for="profile-email">Email</Label>
			<Input
				id="profile-email"
				type="email"
				value={profile.email}
				readonly
				class="bg-muted/40"
				autocomplete="email"
			/>
		</div>
		<p class="text-muted-foreground text-xs leading-relaxed">
			{#if profile.emailVerified}
				This email is verified and used for sign-in and workspace notifications.
			{:else}
				Verify your email to unlock full workspace access. Check your inbox for a verification
				code or visit Security to resend it.
			{/if}
		</p>
	</Card.Content>
</Card.Root>
