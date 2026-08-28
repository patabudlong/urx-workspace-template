<script lang="ts">
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import {
		PM_ONBOARDING_DOMAIN_STATUSES,
		PM_ONBOARDING_HOSTING_PREFERENCES
	} from '$lib/shared/models/pm-project-onboarding';
	import {
		PM_CLIENT_ONBOARDING_ALREADY_SUBMITTED_MESSAGE,
		PM_CLIENT_ONBOARDING_INVALID_LINK_MESSAGE,
		PM_CLIENT_ONBOARDING_SUBMITTED_MESSAGE
	} from '$lib/shared/project-management/messages';
	import {
		getPmProjectTypeLabel,
		pmProjectIncludesWebsite
	} from '$lib/shared/project-management/project-types';
	import { pmClientOnboardingFormSchema } from '$lib/shared/project-management/schemas';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let submitting = $state(false);

	const showWebsiteFields = $derived(
		data.preview ? pmProjectIncludesWebsite(data.preview.projectTypes) : false
	);

	const domainStatusLabels: Record<string, string> = {
		[PM_ONBOARDING_DOMAIN_STATUSES.HAVE_DOMAIN]: 'We already have a domain',
		[PM_ONBOARDING_DOMAIN_STATUSES.NEED_HELP]: 'We need help getting a domain',
		[PM_ONBOARDING_DOMAIN_STATUSES.NOT_SURE]: 'Not sure yet'
	};

	const hostingLabels: Record<string, string> = {
		[PM_ONBOARDING_HOSTING_PREFERENCES.WE_HOST]: 'You host the website',
		[PM_ONBOARDING_HOSTING_PREFERENCES.CLIENT_HOSTS]: 'We will host it ourselves',
		[PM_ONBOARDING_HOSTING_PREFERENCES.NOT_SURE]: 'Not sure yet'
	};

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(pmClientOnboardingFormSchema),
		resetForm: false,
		onSubmit: () => {
			submitting = true;
		},
		onUpdated: () => {
			submitting = false;
		},
		onError: () => {
			submitting = false;
		}
	});

	const { enhance, form, message: formMessage } = superform;

	const submitted = $derived($formMessage === PM_CLIENT_ONBOARDING_SUBMITTED_MESSAGE);
	const alreadySubmitted = $derived(
		Boolean(data.preview?.alreadySubmitted) || $formMessage === PM_CLIENT_ONBOARDING_ALREADY_SUBMITTED_MESSAGE
	);
</script>

<div class="flex flex-col gap-8">
	<div class="space-y-2 text-center">
		<h1 class="text-2xl font-semibold tracking-tight">Project onboarding</h1>
		{#if data.preview}
			<p class="text-muted-foreground text-sm">
				{data.preview.workspaceName} · {data.preview.projectTitle}
			</p>
			<div class="flex flex-wrap justify-center gap-2 pt-1">
				{#each data.preview.projectTypes as projectType (projectType)}
					<Badge variant="secondary">{getPmProjectTypeLabel(projectType)}</Badge>
				{/each}
			</div>
		{/if}
	</div>

	{#if !data.preview}
		<StatusAlert
			variant="danger"
			title="Invalid onboarding link"
			description={PM_CLIENT_ONBOARDING_INVALID_LINK_MESSAGE}
		/>
	{:else if submitted || alreadySubmitted}
		<StatusAlert
			variant="success"
			title="Onboarding received"
			description={submitted
				? PM_CLIENT_ONBOARDING_SUBMITTED_MESSAGE
				: PM_CLIENT_ONBOARDING_ALREADY_SUBMITTED_MESSAGE}
		/>
	{:else}
		{#if typeof $formMessage === 'string' && $formMessage.length > 0 && $formMessage !== PM_CLIENT_ONBOARDING_SUBMITTED_MESSAGE}
			<StatusAlert variant="danger" title="Could not submit form" description={$formMessage} />
		{/if}

		<form method="POST" use:enhance class="space-y-6">
			<Card.Root>
				<Card.Header>
					<Card.Title>Contact details</Card.Title>
					<Card.Description>Who should we coordinate with for this project?</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="space-y-2">
						<Label for="contactName">Contact name</Label>
						<Input id="contactName" name="contactName" bind:value={$form.contactName} />
					</div>
					<div class="space-y-2">
						<Label for="contactEmail">Email</Label>
						<Input
							id="contactEmail"
							name="contactEmail"
							type="email"
							bind:value={$form.contactEmail}
							readonly
						/>
					</div>
					<div class="space-y-2">
						<Label for="businessName">Business name</Label>
						<Input id="businessName" name="businessName" bind:value={$form.businessName} />
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Project goals</Card.Title>
					<Card.Description>Help us understand what you want this project to achieve.</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="space-y-2">
						<Label for="projectGoals">Goals and scope</Label>
						<Textarea
							id="projectGoals"
							name="projectGoals"
							rows={4}
							bind:value={$form.projectGoals}
						/>
					</div>
					<div class="space-y-2">
						<Label for="pagesNeeded">Deliverables or sections needed (optional)</Label>
						<Textarea id="pagesNeeded" name="pagesNeeded" rows={3} bind:value={$form.pagesNeeded} />
					</div>
					<div class="space-y-2">
						<Label for="brandNotes">Brand notes (optional)</Label>
						<Textarea id="brandNotes" name="brandNotes" rows={3} bind:value={$form.brandNotes} />
					</div>
				</Card.Content>
			</Card.Root>

			{#if showWebsiteFields}
				<Card.Root>
					<Card.Header>
						<Card.Title>Domain and hosting</Card.Title>
						<Card.Description>Website-specific details for this project.</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="space-y-2">
							<Label for="domainStatus">Domain status</Label>
							<select
								id="domainStatus"
								name="domainStatus"
								bind:value={$form.domainStatus}
								class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
							>
								{#each Object.entries(domainStatusLabels) as [value, label] (value)}
									<option {value}>{label}</option>
								{/each}
							</select>
						</div>
						<div class="space-y-2">
							<Label for="hostingPreference">Hosting preference</Label>
							<select
								id="hostingPreference"
								name="hostingPreference"
								bind:value={$form.hostingPreference}
								class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
							>
								{#each Object.entries(hostingLabels) as [value, label] (value)}
									<option {value}>{label}</option>
								{/each}
							</select>
						</div>
					</Card.Content>
				</Card.Root>
			{/if}

			<Card.Root>
				<Card.Header>
					<Card.Title>Additional notes</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="space-y-2">
						<Label for="additionalNotes">Anything else we should know? (optional)</Label>
						<Textarea
							id="additionalNotes"
							name="additionalNotes"
							rows={3}
							bind:value={$form.additionalNotes}
						/>
					</div>
				</Card.Content>
				<Card.Footer>
					<Button type="submit" class="h-10 w-full" disabled={submitting}>
						{#if submitting}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							Submitting…
						{:else}
							Submit onboarding
						{/if}
					</Button>
				</Card.Footer>
			</Card.Root>
		</form>
	{/if}
</div>
