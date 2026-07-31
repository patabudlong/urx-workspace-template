<script lang="ts">
	import OnboardingPanel from '$lib/components/onboarding/onboarding-panel.svelte';
	import OnboardingRoleCard, {
		type OnboardingRoleOption
	} from '$lib/components/onboarding/onboarding-role-card.svelte';
	import OnboardingWelcomeModal from '$lib/components/onboarding/onboarding-welcome-modal.svelte';
	import FormAlert from '$lib/components/auth/form-alert.svelte';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import PhoneCountryInput from '$lib/components/onboarding/phone-country-input.svelte';
	import WorkspaceCountryCombobox from '$lib/components/onboarding/workspace-country-combobox.svelte';
	import WorkspaceFieldAvailability, {
		type WorkspaceAvailabilityStatus
	} from '$lib/components/onboarding/workspace-field-availability.svelte';
	import { fetchWorkspaceAvailability } from '$lib/onboarding/workspace-availability';
	import { hasDismissedOnboardingWelcome } from '$lib/onboarding/welcome';
	import {
		isWorkspaceNameReadyForAvailabilityCheck,
		isWorkspaceSlugReadyForAvailabilityCheck
	} from '$lib/shared/schemas/workspace-availability';
	import { slugifyWorkspaceName } from '$lib/shared/workspace-slug';
	import {
		memberOnboardingClientSchema,
		ownerOnboardingClientSchema
	} from '$lib/shared/schemas/onboarding';
	import { cn } from '$lib/utils.js';
	import CheckCircle2Icon from '@lucide/svelte/icons/circle-check';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { onMount, tick, untrack } from 'svelte';

	let { data } = $props();

	type OnboardingStep = 'role' | 'details' | 'complete';
	type OnboardingRole = 'owner' | 'member';

	const ROLE_OPTIONS = {
		owner: {
			title: 'Workspace owner',
			description:
				'Create a new workspace for your company. Requires team verification before access.',
			imageSrc: '/onboarding/workspace-owner.png?v=4',
			imageAlt: 'Illustration of a professional presenting analytics on a dashboard'
		},
		member: {
			title: 'Team member',
			description: 'Join an existing workspace using the slug or workspace ID from your admin.',
			imageSrc: '/onboarding/team-member.png?v=2',
			imageAlt: 'Illustration of a team collaborating on a workspace page'
		}
	} as const satisfies Record<OnboardingRole, OnboardingRoleOption>;

	let step = $state<OnboardingStep>('role');
	let welcomeOpen = $state(false);
	let selectedRole = $state<OnboardingRole | null>(null);
	let detailsTopRef = $state<HTMLDivElement | null>(null);
	let slugTouched = $state(false);
	let ownerBusy = $state(false);
	let memberBusy = $state(false);
	let nameAvailability = $state<WorkspaceAvailabilityStatus>('idle');
	let slugAvailability = $state<WorkspaceAvailabilityStatus>('idle');
	let availabilityRequestId = 0;

	$effect(() => {
		if (data.access.status === 'pending_review') {
			step = 'complete';
		}
	});

	onMount(() => {
		if (data.access.status !== 'pending_review' && !hasDismissedOnboardingWelcome()) {
			welcomeOpen = true;
		}
	});

	const ownerSuperform = superForm(untrack(() => data.ownerForm), {
		validators: zod4Client(ownerOnboardingClientSchema),
		resetForm: false,
		onSubmit: () => {
			ownerBusy = true;
		},
		onUpdated: () => {
			ownerBusy = false;
		},
		onError: () => {
			ownerBusy = false;
		}
	});

	const memberSuperform = superForm(untrack(() => data.memberForm), {
		validators: zod4Client(memberOnboardingClientSchema),
		onSubmit: () => {
			memberBusy = true;
		},
		onError: () => {
			memberBusy = false;
		}
	});

	const {
		enhance: enhanceOwner,
		form: ownerForm,
		message: ownerMessage
	} = ownerSuperform;

	const {
		enhance: enhanceMember,
		form: memberForm,
		message: memberMessage
	} = memberSuperform;

	function syncSlugFromName() {
		if (slugTouched) {
			return;
		}

		const nextSlug = slugifyWorkspaceName($ownerForm.name);

		untrack(() => {
			$ownerForm.slug = nextSlug;
		});

		scheduleAvailabilityCheck({ name: $ownerForm.name, slug: nextSlug });
	}

	function scheduleAvailabilityCheck(fields: { name?: string; slug?: string }) {
		const requestId = ++availabilityRequestId;

		if (fields.name !== undefined) {
			nameAvailability = isWorkspaceNameReadyForAvailabilityCheck(fields.name) ? 'checking' : 'idle';
		}

		if (fields.slug !== undefined) {
			slugAvailability = isWorkspaceSlugReadyForAvailabilityCheck(fields.slug)
				? 'checking'
				: 'idle';
		}

		window.setTimeout(async () => {
			if (requestId !== availabilityRequestId) {
				return;
			}

			const payload: { name?: string; slug?: string } = {};

			if (fields.name !== undefined && isWorkspaceNameReadyForAvailabilityCheck(fields.name)) {
				payload.name = fields.name;
			}

			if (fields.slug !== undefined && isWorkspaceSlugReadyForAvailabilityCheck(fields.slug)) {
				payload.slug = fields.slug;
			}

			if (!payload.name && !payload.slug) {
				return;
			}

			try {
				const result = await fetchWorkspaceAvailability(payload);

				if (requestId !== availabilityRequestId) {
					return;
				}

				if (payload.name !== undefined) {
					nameAvailability = result.name?.available ? 'available' : 'taken';
				}

				if (payload.slug !== undefined) {
					slugAvailability = result.slug?.available ? 'available' : 'taken';
				}
			} catch {
				if (requestId !== availabilityRequestId) {
					return;
				}

				if (payload.name !== undefined) {
					nameAvailability = 'idle';
				}

				if (payload.slug !== undefined) {
					slugAvailability = 'idle';
				}
			}
		}, 400);
	}

	function handleWorkspaceNameInput() {
		syncSlugFromName();

		if (!slugTouched) {
			return;
		}

		scheduleAvailabilityCheck({ name: $ownerForm.name });
	}

	function handleWorkspaceSlugInput() {
		slugTouched = true;
		$ownerForm.slug = slugifyWorkspaceName($ownerForm.slug);
		scheduleAvailabilityCheck({ slug: $ownerForm.slug });
	}

	const ownerSubmitBlocked = $derived(
		ownerBusy ||
			nameAvailability === 'taken' ||
			slugAvailability === 'taken' ||
			nameAvailability === 'checking' ||
			slugAvailability === 'checking'
	);

	async function chooseRole(role: OnboardingRole) {
		selectedRole = role;
		step = 'details';
		await tick();
		detailsTopRef?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function backToRole() {
		step = 'role';
	}

	const stepLabels = ['Your role', 'Details', 'Done'];
	const stepIndex = $derived(step === 'role' ? 0 : step === 'details' ? 1 : 2);

	const onboardingActionClass = 'h-10 w-full sm:w-auto';

	const panelDescription = $derived(
		step === 'role'
			? 'Every account belongs to one workspace. Create one as an owner or join an existing team.'
			: step === 'details' && selectedRole === 'owner'
				? 'Tell us about your company. Our team will verify your workspace before you get dashboard access.'
				: step === 'details'
					? 'Enter the workspace slug or ID shared by your team admin.'
					: data.access.status === 'pending_review'
						? 'Your workspace request is being reviewed. We will email you once it is approved.'
						: 'Your workspace is ready.'
	);
</script>

<OnboardingWelcomeModal bind:open={welcomeOpen} firstName={data.firstName} />

<OnboardingPanel
	title={step === 'complete' ? 'You are almost there' : 'Set up your workspace'}
	description={panelDescription}
>
	{#snippet actions()}
		<Button type="button" variant="outline" size="sm" onclick={() => (welcomeOpen = true)}>
			<SparklesIcon class="size-4" />
			Welcome tour
		</Button>
	{/snippet}

	<div class="space-y-6">
		<p class="text-muted-foreground text-xs sm:hidden">
			Step {stepIndex + 1} of {stepLabels.length}: {stepLabels[stepIndex]}
		</p>
		<div class="flex items-center gap-2">
			{#each stepLabels as label, index}
				<div
					class={cn(
						'flex min-w-0 flex-col gap-1.5',
						index < stepLabels.length - 1 ? 'flex-1' : 'shrink-0'
					)}
				>
					<div class="flex items-center gap-1.5">
						<span
							class={cn(
								'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-colors',
								index === stepLabels.length - 1 && stepIndex >= index
									? 'bg-emerald-600 text-white'
									: index <= stepIndex
										? 'bg-primary text-primary-foreground'
										: 'bg-muted text-muted-foreground'
							)}
						>
							{index + 1}
						</span>
						{#if index < stepLabels.length - 1}
							<div
								class={cn(
									'h-1.5 min-w-0 flex-1 rounded-full transition-colors',
									index <= stepIndex ? 'bg-primary' : 'bg-muted'
								)}
							></div>
						{/if}
					</div>
					<span
						class={cn(
							'hidden text-[11px] sm:block',
							index <= stepIndex ? 'text-foreground font-medium' : 'text-muted-foreground'
						)}
					>
						{label}
					</span>
				</div>
			{/each}
		</div>

		{#if step === 'role'}
			<div class="grid gap-3 sm:grid-cols-2">
				<OnboardingRoleCard
					option={ROLE_OPTIONS.owner}
					selectable
					onclick={() => chooseRole('owner')}
				/>
				<OnboardingRoleCard
					option={ROLE_OPTIONS.member}
					selectable
					onclick={() => chooseRole('member')}
				/>
			</div>
		{:else if step === 'details' && selectedRole}
			<div bind:this={detailsTopRef} class="scroll-mt-4 space-y-8">
				<OnboardingRoleCard option={ROLE_OPTIONS[selectedRole]} compact />

				{#if selectedRole === 'owner'}
			<form method="POST" action="?/owner" use:enhanceOwner class="space-y-5">
				{#if $ownerMessage}
					<FormAlert>{$ownerMessage}</FormAlert>
				{/if}

				<div class="grid gap-5 md:grid-cols-2">
					<Form.Field form={ownerSuperform} name="name" class="md:col-span-1">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required>Workspace name</Form.Label>
								<Input
									{...props}
									id="workspace-name"
									bind:value={$ownerForm.name}
									oninput={handleWorkspaceNameInput}
									autocomplete="organization"
								/>
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
						<WorkspaceFieldAvailability
							status={nameAvailability}
							takenMessage="This workspace name is already taken."
						/>
					</Form.Field>

					<Form.Field form={ownerSuperform} name="slug" class="md:col-span-1">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required>Workspace URL</Form.Label>
								<div class="flex items-center gap-2">
									<Input
										{...props}
										id="workspace-slug"
										bind:value={$ownerForm.slug}
										oninput={handleWorkspaceSlugInput}
										autocomplete="off"
										spellcheck="false"
										class="min-w-0 flex-1"
									/>
									<span class="text-muted-foreground shrink-0 text-sm">.workspace.urixoft.com</span>
								</div>
								<p class="text-muted-foreground mt-1 text-xs">
									Auto-filled from your workspace name and editable now. This URL cannot be changed
									later.
								</p>
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
						<WorkspaceFieldAvailability
							status={slugAvailability}
							takenMessage="This workspace URL is already taken."
						/>
					</Form.Field>

					<Form.Field form={ownerSuperform} name="contactPhone">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required>Contact number</Form.Label>
								<PhoneCountryInput
									id={props.id}
									name={props.name}
									aria-invalid={props['aria-invalid']}
									aria-describedby={props['aria-describedby']}
									bind:value={$ownerForm.contactPhone}
								/>
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>

					<Form.Field form={ownerSuperform} name="teamSize">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required>Team size</Form.Label>
								<Select.Root type="single" bind:value={$ownerForm.teamSize}>
									<Select.Trigger class="h-8 w-full">
										<span class="truncate">
											{data.teamSizeOptions.find((option) => option.value === $ownerForm.teamSize)
												?.label ?? 'Select team size'}
										</span>
									</Select.Trigger>
									<Select.Content>
										<Select.Group>
											{#each data.teamSizeOptions as option (option.value)}
												<Select.Item value={option.value} label={option.label}>
													{option.label}
												</Select.Item>
											{/each}
										</Select.Group>
									</Select.Content>
								</Select.Root>
								<input type="hidden" name={props.name} value={$ownerForm.teamSize} />
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>

					<Form.Field form={ownerSuperform} name="website" class="md:col-span-1">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required={false}>
									Website
									<span class="text-muted-foreground text-[0.65rem] font-normal tracking-wide">
										(optional)
									</span>
								</Form.Label>
								<Input
									{...props}
									id="website"
									bind:value={$ownerForm.website}
									autocomplete="url"
								/>
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>
				</div>

				<div class="space-y-4 rounded-xl border p-4 sm:p-5">
					<p class="text-sm font-medium">Business address</p>

					<Form.Field form={ownerSuperform} name="country">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required>Country</Form.Label>
								<WorkspaceCountryCombobox
									id="country"
									countries={data.countries}
									bind:value={$ownerForm.country}
								/>
								<input type="hidden" name={props.name} value={$ownerForm.country} />
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>

					<Form.Field form={ownerSuperform} name="addressLine1">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required>Street address</Form.Label>
								<Input
									{...props}
									id="address-line-1"
									bind:value={$ownerForm.addressLine1}
									autocomplete="address-line1"
								/>
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>

					<div class="grid gap-4 md:grid-cols-2">
						<Form.Field form={ownerSuperform} name="city">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label required>City</Form.Label>
									<Input {...props} id="city" bind:value={$ownerForm.city} autocomplete="address-level2" />
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
						</Form.Field>

						<Form.Field form={ownerSuperform} name="region">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>
										State / region
										<span class="text-muted-foreground text-[0.65rem] font-normal tracking-wide">
											(optional)
										</span>
									</Form.Label>
									<Input {...props} id="region" bind:value={$ownerForm.region} autocomplete="address-level1" />
								{/snippet}
							</Form.Control>
						</Form.Field>
					</div>

					<div class="grid gap-4 md:grid-cols-2">
						<Form.Field form={ownerSuperform} name="postalCode">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>
										Postal code
										<span class="text-muted-foreground text-[0.65rem] font-normal tracking-wide">
											(optional)
										</span>
									</Form.Label>
									<Input {...props} id="postal-code" bind:value={$ownerForm.postalCode} autocomplete="postal-code" />
								{/snippet}
							</Form.Control>
						</Form.Field>
					</div>
				</div>

				<div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
					<Button type="button" variant="outline" class={onboardingActionClass} onclick={backToRole}>
						Back
					</Button>
					<Button
						type="submit"
						class={cn(onboardingActionClass, ownerBusy && 'pointer-events-none cursor-wait')}
						disabled={ownerSubmitBlocked}
					>
						{#if ownerBusy}
							<Loader2Icon class="size-4 animate-spin" />
						{/if}
						Submit for verification
					</Button>
				</div>
			</form>
				{:else}
			<form method="POST" action="?/member" use:enhanceMember class="mx-auto max-w-xl space-y-5">
				{#if $memberMessage}
					<FormAlert>{$memberMessage}</FormAlert>
				{/if}

				<StatusAlert variant="info" title="Need your workspace details?">
					Ask your workspace admin for the slug (e.g. <strong>acme-services</strong>) or the workspace
					ID.
				</StatusAlert>

				<Form.Field form={memberSuperform} name="workspaceRef">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label required>Workspace slug or ID</Form.Label>
							<Input
								{...props}
								id="workspace-ref"
								bind:value={$memberForm.workspaceRef}
								autocomplete="off"
								spellcheck="false"
							/>
						{/snippet}
					</Form.Control>
					<SingleFieldErrors />
				</Form.Field>

				<div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
					<Button type="button" variant="outline" class={onboardingActionClass} onclick={backToRole}>
						Back
					</Button>
					<Button
						type="submit"
						class={cn(onboardingActionClass, memberBusy && 'pointer-events-none cursor-wait')}
						disabled={memberBusy}
					>
						{#if memberBusy}
							<Loader2Icon class="size-4 animate-spin" />
						{/if}
						Join workspace
					</Button>
				</div>
			</form>
				{/if}
			</div>
		{:else if step === 'complete'}
			<div class="mx-auto max-w-2xl space-y-5">
				<div class="bg-muted/30 flex flex-col items-center gap-4 rounded-xl border p-8 text-center">
					{#if data.access.status === 'pending_review'}
						<ClockIcon class="text-primary size-12" />
						<div class="space-y-2">
							<h3 class="text-lg font-semibold">Request submitted</h3>
							<p class="text-muted-foreground text-sm leading-relaxed">
								We are reviewing <strong>{data.access.workspaceName}</strong>
								(<span class="font-mono text-xs">{data.access.workspaceSlug}</span>). You will receive an
								email once your workspace is approved.
							</p>
						</div>
					{:else}
						<CheckCircle2Icon class="text-primary size-12" />
						<div class="space-y-2">
							<h3 class="text-lg font-semibold">Workspace request received</h3>
							<p class="text-muted-foreground text-sm leading-relaxed">
								Our team will verify your workspace details and email you when your dashboard is ready.
							</p>
						</div>
					{/if}
				</div>

				<StatusAlert
					variant="info"
					title="You can come back later"
					description="You can sign out and return later. Dashboard access unlocks after workspace approval or when you join an active team."
				/>

				{#if data.isSuperadmin}
					<StatusAlert variant="plain" title="Platform admin">
						Review pending workspace requests at
						<a href="/admin/workspace-requests" class="text-primary font-medium hover:underline">
							/admin/workspace-requests
						</a>.
					</StatusAlert>
				{/if}
			</div>
		{/if}
	</div>
</OnboardingPanel>
