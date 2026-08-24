<script lang="ts">
	import AppIcon from '$lib/components/app-icon.svelte';
	import DashboardCard from '$lib/components/dashboard/dashboard-card.svelte';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatCard from '$lib/components/dashboard/stat-card.svelte';
	import WorkspaceGrowthChart from '$lib/components/dashboard/workspace-growth-chart.svelte';
	import WorkspaceModulesPanel from '$lib/components/dashboard/workspace-modules-panel.svelte';
	import WorkspaceRecentEvents from '$lib/components/dashboard/workspace-recent-events.svelte';
	import WorkspaceTeamPreview from '$lib/components/dashboard/workspace-team-preview.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { SOLAR } from '$lib/icons/solar-icons';

	let { data } = $props();

	const greetingName = $derived(data.firstName || data.user.email.split('@')[0] || 'there');
	const overview = $derived(data.overview);

	const memberTrend = $derived.by(() => {
		if (!overview) {
			return null;
		}

		const delta = overview.membersJoinedThisMonth - overview.membersJoinedLastMonth;

		if (delta > 0) {
			return { label: `+${delta} this month`, direction: 'up' as const };
		}

		if (delta < 0) {
			return { label: `${delta} this month`, direction: 'down' as const };
		}

		return { label: 'No change', direction: 'neutral' as const };
	});
</script>

<div class="flex w-full flex-col gap-8">
	<PageHeader
		eyebrow="Workspace overview"
		title={`Welcome back, ${greetingName}`}
		description="Monitor team activity, workspace modules, and developer resources from one place."
	>
		{#snippet actions()}
			<Button href="/team/invitations" variant="outline" size="sm">
				<AppIcon icon={SOLAR.inviteUser} />
				Invite teammate
			</Button>
			<Button href="/docs" variant="outline" size="sm">
				<AppIcon icon={SOLAR.apiDocs} />
				API docs
			</Button>
		{/snippet}
	</PageHeader>

	{#if overview}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<StatCard
				label="Team members"
				value={String(overview.memberCount)}
				period="Active workspace"
				trend={memberTrend ?? undefined}
				icon={SOLAR.team}
			/>
			<StatCard
				label="Online now"
				value={String(overview.onlineCount)}
				period="Team presence"
				trend={{ label: 'Live', direction: 'neutral' }}
				icon={SOLAR.online}
			/>
			<StatCard
				label="Active modules"
				value="{overview.enabledModuleCount}/{overview.totalModuleCount}"
				period="Workspace packages"
				trend={{
					label: overview.enabledModuleCount === overview.totalModuleCount ? 'All enabled' : 'Partial',
					direction: overview.enabledModuleCount > 0 ? 'up' : 'neutral'
				}}
				icon={SOLAR.modules}
			/>
			<StatCard
				label="Pending invites"
				value={String(overview.pendingInvitationCount)}
				period="Awaiting acceptance"
				trend={{
					label: overview.pendingInvitationCount === 0 ? 'Clear' : 'Open',
					direction: overview.pendingInvitationCount === 0 ? 'up' : 'neutral'
				}}
				icon={SOLAR.invitations}
			/>
		</div>

		<div class="grid gap-4 xl:grid-cols-3">
			<DashboardCard class="xl:col-span-2">
				<Card.Header>
					<Card.Title>Team growth</Card.Title>
					<Card.Description>New members joined over the last six months.</Card.Description>
				</Card.Header>
				<Card.Content>
					<WorkspaceGrowthChart points={overview.growth} />
				</Card.Content>
			</DashboardCard>

			<WorkspaceModulesPanel modules={overview.modules} />
		</div>

		<div class="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
			<WorkspaceTeamPreview members={overview.members} memberCount={overview.memberCount} />
			<WorkspaceRecentEvents events={overview.activities} />
		</div>
	{/if}

	<DashboardCard>
		<Card.Header>
			<Card.Title>Quick actions</Card.Title>
			<Card.Description>Common links for your team and developers.</Card.Description>
		</Card.Header>
		<Card.Content class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
			<Button href="/team" variant="outline" class="h-auto justify-start px-4 py-3">
				<div class="flex w-full items-center gap-3">
					<div class="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
						<AppIcon icon={SOLAR.team} />
					</div>
					<div class="min-w-0 text-left">
						<p class="text-sm font-medium">Manage team</p>
						<p class="text-muted-foreground text-xs">View members, roles, and invitations</p>
					</div>
				</div>
			</Button>

			<Button href="/modules" variant="outline" class="h-auto justify-start px-4 py-3">
				<div class="flex w-full items-center gap-3">
					<div class="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
						<AppIcon icon={SOLAR.modules} />
					</div>
					<div class="min-w-0 text-left">
						<p class="text-sm font-medium">Workspace modules</p>
						<p class="text-muted-foreground text-xs">Enable mailbox, payroll, and DTR packages</p>
					</div>
				</div>
			</Button>

			<Button href="/docs" variant="outline" class="h-auto justify-start px-4 py-3">
				<div class="flex w-full items-center gap-3">
					<div class="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
						<AppIcon icon={SOLAR.apiDocs} />
					</div>
					<div class="min-w-0 text-left">
						<p class="text-sm font-medium">Browse API docs</p>
						<p class="text-muted-foreground text-xs">OpenAPI reference for web and mobile clients</p>
					</div>
				</div>
			</Button>

			<Button href="/api/v1/health" variant="outline" class="h-auto justify-start px-4 py-3" target="_blank">
				<div class="flex w-full items-center gap-3">
					<div class="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
						<AppIcon icon={SOLAR.activity} />
					</div>
					<div class="min-w-0 text-left">
						<p class="text-sm font-medium">Check API health</p>
						<p class="text-muted-foreground text-xs">Verify connectivity and service status</p>
					</div>
				</div>
			</Button>

			<Button href="/docs" size="sm" class="h-auto justify-start px-4 py-3 sm:col-span-2 xl:col-span-1">
				Explore the API
				<AppIcon icon={SOLAR.arrowRight} />
			</Button>
		</Card.Content>
	</DashboardCard>
</div>
