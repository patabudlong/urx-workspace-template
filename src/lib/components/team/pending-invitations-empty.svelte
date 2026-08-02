<script lang="ts">
	import MailIcon from '@lucide/svelte/icons/mail';
</script>

<div
	class="border-border bg-muted/20 flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center"
>
	<span
		class="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full"
		aria-hidden="true"
	>
		<MailIcon class="size-5" />
	</span>
	<div class="space-y-1">
		<p class="text-foreground text-sm font-medium">No pending invitations</p>
		<p class="text-muted-foreground max-w-sm text-sm">
			Invitations you send will appear here until they are accepted.
		</p>
	</div>
</div>
