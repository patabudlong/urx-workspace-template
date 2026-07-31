<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	let open = $state(false);
</script>

<Button variant="outline" size="sm" onclick={() => (open = true)}>Sign out</Button>

<Dialog.Root bind:open>
	<Dialog.Content showCloseButton={false}>
		<Dialog.Header>
			<Dialog.Title>Sign out?</Dialog.Title>
			<Dialog.Description>
				You will need to sign in again to access your workspace.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer class="flex-row justify-end gap-2 sm:justify-end">
			<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<form method="POST" action="/logout" class="contents">
				<Button type="submit" variant="destructive">Sign out</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
