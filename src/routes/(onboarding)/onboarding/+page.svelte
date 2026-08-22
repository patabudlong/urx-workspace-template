<script lang="ts">
	import { onDestroy, onMount, tick, untrack } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import AuthFormMessageAlert from '$lib/components/auth/auth-form-message-alert.svelte';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import OnboardingElementTour, {
		type ElementTourStep
	} from '$lib/components/onboarding/onboarding-element-tour.svelte';
	import OnboardingWalkthrough, {
		type WalkthroughStep
	} from '$lib/components/onboarding/onboarding-walkthrough.svelte';
	import PhoneCountryInput from '$lib/components/onboarding/phone-country-input.svelte';
	import SubmitProgressBar from '$lib/components/onboarding/submit-progress-bar.svelte';
	import WorkspaceBrandLogoUpload from '$lib/components/onboarding/workspace-brand-logo-upload.svelte';
	import WorkspaceCountryCombobox from '$lib/components/onboarding/workspace-country-combobox.svelte';
	import WorkspaceFieldAvailability, {
		type WorkspaceAvailabilityStatus
	} from '$lib/components/onboarding/workspace-field-availability.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { fetchOnboardingAccess } from '$lib/onboarding/access-poll';
	import { fetchWorkspaceAvailability } from '$lib/onboarding/workspace-availability';
	import { buildWorkspaceUrlFromWindow } from '$lib/workspace-host';
	import {
		memberOnboardingClientSchema,
		ownerOnboardingClientSchema,
		type OwnerOnboardingInput
	} from '$lib/shared/schemas/onboarding';
	import {
		isWorkspaceNameReadyForAvailabilityCheck,
		isWorkspaceSlugReadyForAvailabilityCheck
	} from '$lib/shared/schemas/workspace-availability';
	import { slugifyWorkspaceName } from '$lib/shared/workspace-slug';
	import {
		isWorkspaceLogoMimeType,
		WORKSPACE_LOGO_MAX_BYTES
	} from '$lib/shared/workspace-branding';
	import { cn } from '$lib/utils.js';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { superForm } from 'sveltekit-superforms';
	import type { FormPathLeaves, ValidationErrors } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	type WizardStepId =
		| 'choose'
		| 'workspace'
		| 'location'
		| 'contact'
		| 'brand'
		| 'review'
		| 'join'
		| 'pending';
	type OnboardingMode = 'create' | 'join';

	const createSteps: WalkthroughStep[] = [
		{ id: 'choose', title: 'Get started', description: 'Create a workspace or join your team.' },
		{
			id: 'workspace',
			title: 'Workspace profile',
			description: 'Name your company and tell us about your team.'
		},
		{ id: 'location', title: 'Location', description: 'Where your organization is based.' },
		{ id: 'contact', title: 'Contact details', description: 'How we can reach you for verification.' },
		{ id: 'brand', title: 'Brand & logo', description: 'Add your company logo (optional).' },
		{ id: 'review', title: 'Review & submit', description: 'Confirm everything looks right.' }
	];

	const joinSteps: WalkthroughStep[] = [
		{ id: 'choose', title: 'Get started', description: 'Create a workspace or join your team.' },
		{ id: 'join', title: 'Join workspace', description: 'Enter the invite code from your admin.' }
	];

	type OwnerField = FormPathLeaves<OwnerOnboardingInput>;

	const OWNER_STEP_FIELDS: Partial<Record<WizardStepId, OwnerField[]>> = {
		workspace: ['name', 'slug', 'teamSize'],
		location: ['country', 'addressLine1', 'city'],
		contact: ['contactPhone']
	};

	let mode = $state<OnboardingMode>('create');
	let wizardStep = $state<WizardStepId>(
		untrack(() => (data.access.status === 'pending_review' ? 'pending' : 'choose'))
	);
	let stepError = $state('');
	let tourReady = $state(true);
	let tourActive = $state(untrack(() => data.access.status !== 'pending_review'));
	let tourRunId = $state(0);
	let slugTouched = $state(false);
	let availabilityRequestId = 0;
	let nameAvailability = $state<WorkspaceAvailabilityStatus>('idle');
	let slugAvailability = $state<WorkspaceAvailabilityStatus>('idle');
	let brandLogoFile = $state<File | null>(null);
	let brandLogoPreview = $state<string | null>(null);

	const walkthroughSteps = $derived(mode === 'create' ? createSteps : joinSteps);

	const ownerSuperform = superForm(untrack(() => data.ownerForm), {
		validators: zod4Client(ownerOnboardingClientSchema),
		resetForm: false,
		onSubmit: ({ formData, validators }) => {
			validators(false);

			if (brandLogoFile) {
				formData.set('brandLogo', brandLogoFile);
			}
		},
		onResult: async ({ result }) => {
			if (result.type === 'redirect') {
				return;
			}

			if (result.type === 'failure') {
				const actionData = result.data as
					| { ownerForm?: { valid: boolean; errors: ValidationErrors<OwnerOnboardingInput> } }
					| undefined;
				if (actionData?.ownerForm && !actionData.ownerForm.valid) {
					wizardStep = resolveOwnerErrorStep(actionData.ownerForm.errors);
					stepError = 'Please correct the highlighted fields before submitting.';
				}
				return;
			}

			if (result.type === 'success') {
				stepError = '';
				tourActive = false;
				await invalidateAll();
				wizardStep = 'pending';
			}
		}
	});

	const memberSuperform = superForm(untrack(() => data.memberForm), {
		validators: zod4Client(memberOnboardingClientSchema),
		resetForm: false
	});

	const {
		enhance: enhanceOwner,
		form: ownerForm,
		errors: ownerErrors,
		message: ownerMessage,
		submitting: ownerSubmitting,
		validate: validateOwnerField
	} = ownerSuperform;

	const {
		enhance: enhanceMember,
		form: memberForm,
		message: memberMessage,
		submitting: memberSubmitting
	} = memberSuperform;

	const completedStepIds = $derived.by(() => {
		const order = walkthroughSteps.map((step) => step.id);
		const currentIndex = order.indexOf(wizardStep);
		return order.slice(0, Math.max(0, currentIndex));
	});

	const workspaceSlug = $derived($ownerForm.slug);
	const pendingAccess = $derived(
		data.access.status === 'pending_review' ? data.access : null
	);
	const teamSizeLabel = $derived(
		data.teamSizeOptions.find((option) => option.value === $ownerForm.teamSize)?.label ?? ''
	);

	const ownerSubmitBlocked = $derived(
		$ownerSubmitting ||
			(wizardStep === 'workspace' &&
				(nameAvailability === 'taken' ||
					slugAvailability === 'taken' ||
					nameAvailability === 'checking' ||
					slugAvailability === 'checking'))
	);

	const isOwnerWizardStep = $derived(
		mode === 'create' &&
			['workspace', 'location', 'contact', 'brand', 'review'].includes(wizardStep)
	);

	const elementTourSteps = $derived.by((): ElementTourStep[] => {
		const closeStep: ElementTourStep = {
			title: 'Close the tour anytime',
			description: 'Use Skip tour or the close button whenever you are ready to continue on your own.',
			placement: 'center'
		};

		if (wizardStep === 'choose') {
			return [
				{
					target: '[data-tour="selection"]',
					title: 'Choose how to get started',
					description:
						'Create a new workspace as the owner, or join an existing team with an invite code.',
					placement: 'left'
				},
				{
					target: '[data-tour="progress-guide"]',
					title: 'Follow the setup guide',
					description: 'This bar tracks where you are in onboarding and what comes next.',
					placement: 'bottom'
				},
				closeStep
			];
		}

		if (wizardStep === 'join') {
			return [
				{
					target: '[data-tour="selection"]',
					title: 'Enter your invite details',
					description: 'Paste the workspace slug or invite code shared by your team admin.',
					placement: 'bottom'
				},
				{
					target: '[data-tour="next-action"]',
					title: 'Join your workspace',
					description: 'Click Join workspace once your invite code is entered.',
					placement: 'top'
				},
				closeStep
			];
		}

		if (wizardStep === 'review') {
			return [
				{
					target: '[data-tour="selection"]',
					title: 'Review your details',
					description: 'Check that your workspace information is correct before submitting.',
					placement: 'bottom'
				},
				{
					target: '[data-tour="next-action"]',
					title: 'Submit for approval',
					description: 'Click Submit for approval when everything looks good.',
					placement: 'top'
				},
				closeStep
			];
		}

		return [
			{
				target: '[data-tour="selection"]',
				title: 'Complete this step',
				description: 'Fill in the required fields for this part of your workspace setup.',
				placement: 'bottom'
			},
			{
				target: '[data-tour="next-action"]',
				title: 'Move to the next step',
				description: 'Click Continue when you are done to keep going.',
				placement: 'top'
			},
			closeStep
		];
	});

	$effect(() => {
		if (data.access.status === 'pending_review') {
			wizardStep = 'pending';
			tourActive = false;
		}
	});

	onDestroy(() => {
		if (brandLogoPreview) {
			URL.revokeObjectURL(brandLogoPreview);
		}
	});

	onMount(() => {
		if (data.access.status !== 'pending_review') {
			return;
		}

		const controller = new AbortController();
		const interval = window.setInterval(async () => {
			try {
				const access = await fetchOnboardingAccess();
				if (access.status === 'ready') {
					window.clearInterval(interval);
					window.location.assign(buildWorkspaceUrlFromWindow(access.workspaceSlug));
				}
			} catch (error) {
				if (error instanceof Error && error.name === 'AbortError') {
					return;
				}
			}
		}, 5000);

		return () => {
			window.clearInterval(interval);
			controller.abort();
		};
	});

	function dismissElementTour() {
		tourActive = false;
	}

	function showElementTour() {
		tourActive = true;
		tourRunId += 1;
	}

	async function focusWizardStepInput(step: WizardStepId) {
		await tick();

		const inputId =
			step === 'workspace'
				? 'workspace-name'
				: step === 'join'
					? 'workspace-ref'
					: step === 'brand'
						? 'workspace-brand-logo'
						: null;

		if (!inputId) {
			return;
		}

		document.getElementById(inputId)?.focus();
	}

	function setBrandLogo(file: File | null) {
		if (brandLogoPreview) {
			URL.revokeObjectURL(brandLogoPreview);
		}

		if (!file) {
			brandLogoFile = null;
			brandLogoPreview = null;
			return;
		}

		if (!isWorkspaceLogoMimeType(file.type)) {
			stepError = 'Upload a PNG, JPG, WebP, or SVG logo up to 2 MB.';
			return;
		}

		if (file.size > WORKSPACE_LOGO_MAX_BYTES) {
			stepError = 'Logo must be 2 MB or smaller.';
			return;
		}

		stepError = '';
		brandLogoFile = file;
		brandLogoPreview = URL.createObjectURL(file);
	}

	function clearBrandLogo() {
		setBrandLogo(null);
	}

	function handleBrandLogoError(message: string) {
		stepError = message;
	}

	function selectMode(next: OnboardingMode) {
		mode = next;
		stepError = '';
		wizardStep = next === 'create' ? 'workspace' : 'join';
		void focusWizardStepInput(wizardStep);
	}

	function goBack() {
		stepError = '';
		if (wizardStep === 'join' || wizardStep === 'workspace') {
			wizardStep = 'choose';
			return;
		}

		const order: WizardStepId[] =
			mode === 'create'
				? ['choose', 'workspace', 'location', 'contact', 'brand', 'review']
				: ['choose', 'join'];
		const index = order.indexOf(wizardStep);
		if (index > 0) wizardStep = order[index - 1];
	}

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
			slugAvailability = isWorkspaceSlugReadyForAvailabilityCheck(fields.slug) ? 'checking' : 'idle';
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

	async function ensureWorkspaceSlugAvailable(): Promise<boolean> {
		if (!isWorkspaceSlugReadyForAvailabilityCheck($ownerForm.slug)) {
			return false;
		}

		if (slugAvailability === 'available') {
			return true;
		}

		if (slugAvailability === 'taken') {
			await validateOwnerField('slug', {
				update: true,
				errors: 'This workspace URL is already taken. Try a different company name.'
			});
			return false;
		}

		const requestId = ++availabilityRequestId;
		slugAvailability = 'checking';

		try {
			const result = await fetchWorkspaceAvailability({ slug: $ownerForm.slug });
			if (requestId !== availabilityRequestId) {
				return true;
			}

			slugAvailability = result.slug?.available ? 'available' : 'taken';
			if (!result.slug?.available) {
				await validateOwnerField('slug', {
					update: true,
					errors: 'This workspace URL is already taken. Try a different company name.'
				});
				return false;
			}
		} catch {
			stepError = 'Unable to verify workspace URL availability. Try again.';
			return false;
		}

		return true;
	}

	async function validateCurrentOwnerStep(): Promise<boolean> {
		const fields = OWNER_STEP_FIELDS[wizardStep];
		if (!fields) {
			return true;
		}

		let valid = true;

		for (const field of fields) {
			const messages = await validateOwnerField(field, { update: true, taint: true });
			if (messages?.length) {
				valid = false;
			}
		}

		if (wizardStep === 'workspace') {
			if (nameAvailability === 'taken') {
				await validateOwnerField('name', {
					update: true,
					errors: 'This workspace name is already taken.'
				});
				valid = false;
			}

			if (slugAvailability === 'taken') {
				await validateOwnerField('slug', {
					update: true,
					errors: 'This workspace URL is already taken.'
				});
				valid = false;
			}
		}

		if (valid) {
			stepError = '';
		}

		return valid;
	}

	async function goNext() {
		if (wizardStep === 'workspace') {
			if (!(await validateCurrentOwnerStep())) {
				return;
			}
			if (!(await ensureWorkspaceSlugAvailable())) {
				return;
			}
		} else if (wizardStep === 'location' || wizardStep === 'contact') {
			if (!(await validateCurrentOwnerStep())) {
				return;
			}
		}

		const order: WizardStepId[] = ['choose', 'workspace', 'location', 'contact', 'brand', 'review'];
		const index = order.indexOf(wizardStep);
		if (index >= 0 && index < order.length - 1) {
			wizardStep = order[index + 1];
			stepError = '';
		}
	}

	function formatAddressSummary(): string {
		return [
			$ownerForm.addressLine1,
			$ownerForm.city,
			$ownerForm.region,
			$ownerForm.postalCode,
			$ownerForm.country
		]
			.filter(Boolean)
			.join(', ') || '—';
	}

	function resolveOwnerErrorStep(errors: ValidationErrors<OwnerOnboardingInput>): WizardStepId {
		const fieldToStep: Partial<Record<OwnerField, WizardStepId>> = {
			name: 'workspace',
			slug: 'workspace',
			teamSize: 'workspace',
			country: 'location',
			addressLine1: 'location',
			city: 'location',
			contactPhone: 'contact',
			website: 'contact'
		};

		for (const [field, messages] of Object.entries(errors)) {
			if (messages?.length) {
				const step = fieldToStep[field as OwnerField];
				if (step) {
					return step;
				}
			}
		}

		return 'review';
	}
</script>

<main class="onboarding-page mx-auto flex w-full max-w-xl flex-col items-center gap-8 p-4 sm:p-6 lg:max-w-5xl lg:gap-10">
	{#if wizardStep !== 'pending'}
		<OnboardingWalkthrough
			steps={walkthroughSteps}
			currentStepId={wizardStep}
			completedStepIds={completedStepIds}
		>
			{#snippet headerActions()}
				{#if tourReady && !tourActive}
					<Button type="button" variant="outline" size="sm" onclick={showElementTour}>
						<CircleHelpIcon class="size-4" />
						Show tour
					</Button>
				{/if}
			{/snippet}
		</OnboardingWalkthrough>
	{/if}

	<section
		class={cn(
			'relative mx-auto grid w-full max-w-xl content-start gap-6',
			($ownerSubmitting || $memberSubmitting) && 'opacity-95'
		)}
	>
		<SubmitProgressBar active={$ownerSubmitting || $memberSubmitting} label="Submitting…" />

		{#if stepError && isOwnerWizardStep}
			<AuthFormMessageAlert message={stepError} />
		{/if}

		{#if $ownerMessage && isOwnerWizardStep}
			<AuthFormMessageAlert message={$ownerMessage} />
		{/if}

		{#if $memberMessage && wizardStep === 'join'}
			<AuthFormMessageAlert message={$memberMessage} />
		{/if}

		{#if wizardStep !== 'choose' && wizardStep !== 'pending'}
			<Button type="button" variant="ghost" size="sm" class="w-fit px-2" onclick={goBack}>
				<ArrowLeftIcon class="size-4" />
				Back
			</Button>
		{/if}

		{#if wizardStep === 'choose'}
			<div class="grid gap-6" data-tour="selection">
				<div class="space-y-2 text-center">
					<p class="text-primary text-sm font-semibold">
						Welcome{data.firstName ? `, ${data.firstName}` : ''}
					</p>
					<h1 class="text-foreground text-3xl leading-tight font-semibold tracking-tight">
						Let's set up your workspace
					</h1>
					<p class="text-muted-foreground m-0 text-sm leading-relaxed sm:text-base">
						Choose how you'd like to get started on the Urixoft Workspace platform.
					</p>
				</div>

				<div
					class="bg-card border-border divide-border overflow-hidden rounded-xl border shadow-sm divide-y"
				>
					<button
						type="button"
						class="hover:bg-muted/50 group flex w-full items-center gap-4 p-5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						onclick={() => selectMode('create')}
					>
						<img
							src="/onboarding/workspace-owner.png?v=4"
							alt=""
							class="pointer-events-none size-[5.5rem] shrink-0 object-contain transition-transform group-hover:scale-105"
							width="88"
							height="88"
							aria-hidden="true"
						/>
						<div class="min-w-0">
							<strong class="text-foreground block text-base font-semibold">Create a workspace</strong>
							<span class="text-muted-foreground mt-1 block text-sm leading-relaxed">
								Start fresh as the owner. Ideal for new companies or teams.
							</span>
						</div>
					</button>

					<button
						type="button"
						class="hover:bg-muted/50 group flex w-full items-center gap-4 p-5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						onclick={() => selectMode('join')}
					>
						<img
							src="/onboarding/team-member.png?v=2"
							alt=""
							class="pointer-events-none size-[5.5rem] shrink-0 object-contain transition-transform group-hover:scale-105"
							width="88"
							height="88"
							aria-hidden="true"
						/>
						<div class="min-w-0">
							<strong class="text-foreground block text-base font-semibold">Join a team</strong>
							<span class="text-muted-foreground mt-1 block text-sm leading-relaxed">
								Use an invite code or workspace slug from your administrator.
							</span>
						</div>
					</button>
				</div>
			</div>
		{:else if wizardStep === 'pending' && pendingAccess}
			<div class="space-y-6" data-tour="selection">
				<div class="space-y-2 text-center">
					<p class="text-primary text-sm font-semibold">Almost there</p>
					<h1 class="text-foreground text-2xl font-semibold">Awaiting approval</h1>
					<p class="text-muted-foreground m-0 text-sm leading-relaxed">
						Your workspace
						<strong>{pendingAccess.workspaceName}</strong>
						(<span class="font-mono text-xs">{pendingAccess.workspaceSlug}</span>) is being reviewed. We'll
						email you once it's ready — this page will redirect automatically.
					</p>
				</div>

				<ol class="m-0 grid list-none gap-0 p-0" aria-label="Approval progress">
					{#each [{ id: 'submitted', title: 'Request submitted', description: 'Your workspace details are in our review queue.', status: 'complete' }, { id: 'review', title: 'Admin review', description: 'Our team verifies your organization details.', status: 'current' }, { id: 'approved', title: 'Access granted', description: 'You will be redirected to your dashboard automatically.', status: 'upcoming' }] as step, index (step.id)}
						<li class="relative grid grid-cols-[auto_1fr] gap-3.5 py-3.5">
							{#if index < 2}
								<span
									class={cn(
										'absolute top-11 left-4 h-[calc(100%-0.5rem)] w-0.5 -translate-x-1/2',
										step.status === 'complete' ? 'bg-emerald-500' : 'bg-border'
									)}
									aria-hidden="true"
								></span>
							{/if}
							<span
								class={cn(
									'relative z-[1] flex size-8 items-center justify-center rounded-full text-sm font-semibold',
									step.status === 'complete' && 'bg-emerald-500 text-white',
									step.status === 'current' && 'bg-primary text-primary-foreground ring-primary/20 ring-[3px]',
									step.status === 'upcoming' && 'bg-muted text-muted-foreground'
								)}
								aria-hidden="true"
							>
								{index + 1}
							</span>
							<div>
								<strong class="text-foreground block text-sm font-semibold">{step.title}</strong>
								<p class="text-muted-foreground mt-1 text-sm leading-relaxed">{step.description}</p>
							</div>
						</li>
					{/each}
				</ol>

				<StatusAlert
					variant="info"
					title="You can come back later"
					description="You can sign out and return later. Dashboard access unlocks after workspace approval."
				/>

				{#if data.isSuperadmin}
					<StatusAlert
						variant="plain"
						title="Platform admin"
						description="Review pending workspace requests at /admin/workspace-requests."
					/>
				{/if}
			</div>
		{:else if wizardStep === 'join'}
			<div class="space-y-2 text-center">
				<p class="text-primary text-sm font-semibold">Join team</p>
				<h1 class="text-foreground text-[1.75rem] leading-tight font-semibold">Enter your invite</h1>
				<p class="text-muted-foreground m-0 text-sm leading-relaxed">
					Your workspace admin can share a slug (e.g.
					<code class="bg-muted rounded px-1.5 py-0.5 text-[0.875em]">acme-corp</code>) or workspace ID.
				</p>
			</div>

			<form method="POST" action="?/member" use:enhanceMember class="grid gap-4">
				<div data-tour="selection">
					<Form.Field form={memberSuperform} name="workspaceRef">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required>Invite code or workspace slug</Form.Label>
								<Input
									{...props}
									id="workspace-ref"
									bind:value={$memberForm.workspaceRef}
									autocomplete="off"
									spellcheck="false"
									disabled={$memberSubmitting}
								/>
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
						<p class="text-muted-foreground text-xs">Found in your invitation email or team settings.</p>
					</Form.Field>
				</div>

				<Button
					type="submit"
					class="h-10 w-full"
					data-tour="next-action"
					disabled={$memberSubmitting}
				>
					{#if $memberSubmitting}
						<Loader2Icon class="size-4 animate-spin" />
					{/if}
					Join workspace
				</Button>
			</form>
		{:else}
			<div class="grid gap-4">
				{#if wizardStep === 'workspace'}
					<div class="grid gap-5" data-tour="selection">
						<div class="space-y-2 text-center">
							<p class="text-primary text-sm font-semibold">Step 1 of 5</p>
							<h1 class="text-foreground text-[1.75rem] leading-tight font-semibold">
								Workspace profile
							</h1>
							<p class="text-muted-foreground m-0 text-sm leading-relaxed">
								Tell us about your organization.
							</p>
						</div>

						<Form.Field form={ownerSuperform} name="name">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label required>Company or workspace name</Form.Label>
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

						<Form.Field form={ownerSuperform} name="slug">
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
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
							<p class="text-muted-foreground text-xs">
								Choose carefully — you won't be able to change this URL after your workspace is set up.
							</p>
							<WorkspaceFieldAvailability
								status={slugAvailability}
								takenMessage="This workspace URL is already taken."
							/>
						</Form.Field>

						<Form.Field form={ownerSuperform} name="teamSize">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label required>Team size</Form.Label>
									<Select.Root type="single" bind:value={$ownerForm.teamSize}>
										<Select.Trigger
											class={cn(
												'h-10 w-full',
												$ownerErrors.teamSize && 'border-destructive ring-3 ring-destructive/20'
											)}
											aria-invalid={$ownerErrors.teamSize ? true : undefined}
										>
											<span class="truncate">
												{data.teamSizeOptions.find((option) => option.value === $ownerForm.teamSize)
													?.label ?? 'How many people?'}
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
					</div>
				{:else if wizardStep === 'location'}
					<div class="grid gap-5" data-tour="selection">
						<div class="space-y-2 text-center">
							<p class="text-primary text-sm font-semibold">Step 2 of 5</p>
							<h1 class="text-foreground text-[1.75rem] leading-tight font-semibold">Location</h1>
							<p class="text-muted-foreground m-0 text-sm leading-relaxed">
								Where is your organization based?
							</p>
						</div>

						<Form.Field form={ownerSuperform} name="country">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label required>Country</Form.Label>
									<WorkspaceCountryCombobox
										id={props.id}
										countries={data.countries}
										bind:value={$ownerForm.country}
										aria-invalid={props['aria-invalid']}
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

						<div class="grid gap-4 sm:grid-cols-2">
							<Form.Field form={ownerSuperform} name="city">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label required>City</Form.Label>
										<Input
											{...props}
											id="city"
											bind:value={$ownerForm.city}
											autocomplete="address-level2"
										/>
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
										<Input
											{...props}
											id="region"
											bind:value={$ownerForm.region}
											autocomplete="address-level1"
										/>
									{/snippet}
								</Form.Control>
							</Form.Field>
						</div>

						<Form.Field form={ownerSuperform} name="postalCode">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>
										Postal code
										<span class="text-muted-foreground text-[0.65rem] font-normal tracking-wide">
											(optional)
										</span>
									</Form.Label>
									<Input
										{...props}
										id="postal-code"
										bind:value={$ownerForm.postalCode}
										autocomplete="postal-code"
									/>
								{/snippet}
							</Form.Control>
						</Form.Field>
					</div>
				{:else if wizardStep === 'contact'}
					<div class="grid gap-5" data-tour="selection">
						<div class="space-y-2 text-center">
							<p class="text-primary text-sm font-semibold">Step 3 of 5</p>
							<h1 class="text-foreground text-[1.75rem] leading-tight font-semibold">Contact details</h1>
							<p class="text-muted-foreground m-0 text-sm leading-relaxed">
								We'll use your contact number for verification and workspace updates.
							</p>
						</div>

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

						<Form.Field form={ownerSuperform} name="website">
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
										required={false}
									/>
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
						</Form.Field>
					</div>
				{:else if wizardStep === 'brand'}
					<div class="grid gap-5" data-tour="selection">
						<div class="space-y-2 text-center">
							<p class="text-primary text-sm font-semibold">Step 4 of 5</p>
							<h1 class="text-foreground text-[1.75rem] leading-tight font-semibold">Brand & logo</h1>
							<p class="text-muted-foreground m-0 text-sm leading-relaxed">
								Add your company logo so your workspace feels like home.
							</p>
						</div>

						<div class="grid gap-2">
							<label class="text-sm font-medium" for="workspace-brand-logo">Company logo</label>
							<WorkspaceBrandLogoUpload
								previewUrl={brandLogoPreview}
								fileName={brandLogoFile?.name ?? null}
								onchange={setBrandLogo}
								onclear={clearBrandLogo}
								onerror={handleBrandLogoError}
							/>
							<p class="text-muted-foreground text-xs">
								Optional — you can skip this for now and add or change your logo later in
								<a href="/team/settings" class="text-primary font-medium hover:underline">
									workspace settings
								</a>.
							</p>
						</div>
					</div>
				{:else if wizardStep === 'review'}
					<form
						method="POST"
						action="?/owner"
						enctype="multipart/form-data"
						use:enhanceOwner
						class="grid gap-4"
					>
						<div class="grid gap-5" data-tour="selection">
							<div class="space-y-2 text-center">
								<p class="text-primary text-sm font-semibold">Step 5 of 5</p>
								<h1 class="text-foreground text-[1.75rem] leading-tight font-semibold">
									Review & submit
								</h1>
								<p class="text-muted-foreground m-0 text-sm leading-relaxed">
									Confirm your details before we send your workspace for approval.
								</p>
							</div>

							<dl class="bg-muted/30 border-border m-0 grid gap-3 rounded-lg border p-4">
								<div class="grid gap-0.5">
									<dt class="text-muted-foreground text-xs font-semibold">Workspace</dt>
									<dd class="text-foreground m-0 text-sm font-medium">{$ownerForm.name}</dd>
								</div>
								<div class="grid gap-0.5">
									<dt class="text-muted-foreground text-xs font-semibold">URL slug</dt>
									<dd class="text-foreground m-0 text-sm font-medium">{workspaceSlug || '—'}</dd>
								</div>
								<div class="grid gap-0.5">
									<dt class="text-muted-foreground text-xs font-semibold">Team size</dt>
									<dd class="text-foreground m-0 text-sm font-medium">{teamSizeLabel || '—'}</dd>
								</div>
								<div class="grid gap-0.5">
									<dt class="text-muted-foreground text-xs font-semibold">Country</dt>
									<dd class="text-foreground m-0 text-sm font-medium">{$ownerForm.country || '—'}</dd>
								</div>
								<div class="grid gap-0.5">
									<dt class="text-muted-foreground text-xs font-semibold">Address</dt>
									<dd class="text-foreground m-0 text-sm font-medium">{formatAddressSummary()}</dd>
								</div>
								<div class="grid gap-0.5">
									<dt class="text-muted-foreground text-xs font-semibold">Contact</dt>
									<dd class="text-foreground m-0 text-sm font-medium">{$ownerForm.contactPhone || '—'}</dd>
								</div>
								<div class="grid gap-0.5">
									<dt class="text-muted-foreground text-xs font-semibold">Company logo</dt>
									<dd class="text-foreground m-0 text-sm font-medium">
										{#if brandLogoPreview}
											<img
												src={brandLogoPreview}
												alt="Company logo preview"
												class="bg-background mt-1 size-12 rounded-md border object-contain p-1"
											/>
										{:else}
											Not added
										{/if}
									</dd>
								</div>
								{#if $ownerForm.website}
									<div class="grid gap-0.5">
										<dt class="text-muted-foreground text-xs font-semibold">Website</dt>
										<dd class="text-foreground m-0 text-sm font-medium">{$ownerForm.website}</dd>
									</div>
								{/if}
							</dl>

							<StatusAlert
								variant="info"
								title="Review in progress"
								description="After submission, your workspace will be reviewed by our team. You'll receive an email once approved."
							/>
						</div>

						<input type="hidden" name="name" value={$ownerForm.name} />
						<input type="hidden" name="slug" value={$ownerForm.slug} />
						<input type="hidden" name="contactPhone" value={$ownerForm.contactPhone} />
						<input type="hidden" name="teamSize" value={$ownerForm.teamSize} />
						<input type="hidden" name="addressLine1" value={$ownerForm.addressLine1} />
						<input type="hidden" name="addressLine2" value={$ownerForm.addressLine2 ?? ''} />
						<input type="hidden" name="city" value={$ownerForm.city} />
						<input type="hidden" name="region" value={$ownerForm.region ?? ''} />
						<input type="hidden" name="postalCode" value={$ownerForm.postalCode ?? ''} />
						<input type="hidden" name="country" value={$ownerForm.country} />
						<input type="hidden" name="website" value={$ownerForm.website ?? ''} />

						<Button
							type="submit"
							class="h-10 w-full"
							data-tour="next-action"
							disabled={ownerSubmitBlocked}
						>
							{#if $ownerSubmitting}
								<Loader2Icon class="size-4 animate-spin" />
							{/if}
							Submit for approval
						</Button>
					</form>
				{/if}

				{#if wizardStep !== 'review'}
					<Button type="button" class="h-10 w-full" data-tour="next-action" onclick={goNext}>
						Continue
					</Button>
				{/if}
			</div>
		{/if}
	</section>
</main>

{#if tourActive}
	{#key `${wizardStep}-${tourRunId}`}
		<OnboardingElementTour
			steps={elementTourSteps}
			stepKey={wizardStep}
			bind:active={tourActive}
			onDismiss={dismissElementTour}
		/>
	{/key}
{/if}
