<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import SmartphoneIcon from '@lucide/svelte/icons/smartphone';
</script>

<div class="space-y-6">
	<div class="space-y-1">
		<h2 class="text-2xl font-semibold tracking-tight">Welcome back</h2>
		<p class="text-muted-foreground text-sm">
			URX workspace template — SvelteKit API backend, MongoDB, and mobile-ready JSON APIs.
		</p>
	</div>

	<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
		<Card.Root>
			<Card.Header>
				<Card.Title>API Reference</Card.Title>
				<Card.Description>Interactive Scalar docs for web and mobile teams.</Card.Description>
			</Card.Header>
			<Card.Content class="flex items-center justify-between gap-4">
				<Badge variant="secondary">OpenAPI v1</Badge>
				<Button href="/docs" variant="outline" size="sm">
					Open docs
					<ExternalLinkIcon />
				</Button>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Health endpoint</Card.Title>
				<Card.Description>Poll connectivity for offline and degraded UI states.</Card.Description>
			</Card.Header>
			<Card.Content class="flex items-center justify-between gap-4">
				<code class="text-muted-foreground text-xs">GET /api/v1/health</code>
				<Button href="/api/v1/health" variant="outline" size="sm" target="_blank">
					Check
					<ExternalLinkIcon />
				</Button>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Mobile clients</Card.Title>
				<Card.Description>Versioned JSON API with Bearer auth and shared contracts.</Card.Description>
			</Card.Header>
			<Card.Content class="flex items-center justify-between gap-4">
				<div class="text-muted-foreground flex items-center gap-2 text-sm">
					<SmartphoneIcon class="size-4" />
					<span>/api/v1/*</span>
				</div>
				<Badge>Ready</Badge>
			</Card.Content>
		</Card.Root>
	</div>
</div>
