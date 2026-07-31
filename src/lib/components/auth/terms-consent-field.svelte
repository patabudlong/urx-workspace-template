<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { recordConsentEvent } from '$lib/consent/client';
	import { LEGAL_ROUTES } from '$lib/shared/legal';
	import { CONSENT_CONTEXTS, CONSENT_EVENT_TYPES } from '$lib/shared/models/consent-event';
	import type { SignupInput } from '$lib/shared/schemas/auth';
	import type { SuperForm } from 'sveltekit-superforms';

	type Props = {
		superform: SuperForm<SignupInput>;
		formStore: SuperForm<SignupInput>['form'];
		email?: string;
	};

	let { superform, formStore, email }: Props = $props();

	function handleCheckedChange(checked: boolean | 'indeterminate') {
		if (checked === true) {
			recordConsentEvent({
				type: CONSENT_EVENT_TYPES.TERMS_CHECKBOX,
				context: CONSENT_CONTEXTS.SIGNUP,
				email
			});
		}
	}
</script>

<Form.Field form={superform} name="acceptedTerms" class="space-y-1">
	<Form.Control>
		{#snippet children({ props })}
			<div class="flex items-start gap-3">
				<Checkbox
					{...props}
					class="mt-0.5 shrink-0"
					aria-required="true"
					bind:checked={$formStore.acceptedTerms}
					onCheckedChange={handleCheckedChange}
				/>
				<label
					for={props.id}
					class="text-muted-foreground min-w-0 flex-1 cursor-pointer text-sm leading-relaxed"
				>
					By creating your account, you agree to the
					<a
						href={LEGAL_ROUTES.termsOfService}
						target="_blank"
						rel="noopener noreferrer"
						class="text-primary font-medium hover:underline"
					>
						Terms of Service
					</a>
					and
					<a
						href={LEGAL_ROUTES.privacyNotice}
						target="_blank"
						rel="noopener noreferrer"
						class="text-primary font-medium hover:underline"
					>
						Privacy Notice
					</a>.
					<span
						class="text-muted-foreground ml-1.5 text-[0.65rem] font-normal tracking-wide uppercase"
						aria-hidden="true"
					>
						Required
					</span>
				</label>
			</div>
			<input type="hidden" name={props.name} value={$formStore.acceptedTerms ? 'on' : ''} />
		{/snippet}
	</Form.Control>
	<Form.FieldErrors />
</Form.Field>
