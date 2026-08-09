<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { LEGAL_ROUTES } from '$lib/shared/legal';
	import type { SignupInput } from '$lib/shared/schemas/auth';
	import type { SuperForm } from 'sveltekit-superforms';

	type Props = {
		superform: SuperForm<SignupInput>;
		formStore: SuperForm<SignupInput>['form'];
		disabled?: boolean;
	};

	let { superform, formStore, disabled = false }: Props = $props();
</script>

<Form.Field form={superform} name="acceptedTerms" class="space-y-1">
	<Form.Control>
		{#snippet children({ props })}
			<div class="flex items-start gap-3">
				<Checkbox
					{...props}
					class="mt-0.5 shrink-0"
					aria-required="true"
					{disabled}
					bind:checked={$formStore.acceptedTerms}
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
	<SingleFieldErrors />
</Form.Field>
