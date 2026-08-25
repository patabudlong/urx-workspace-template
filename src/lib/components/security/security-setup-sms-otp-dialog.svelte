<script lang="ts">
	import SecuritySetupOtpDialogBase from '$lib/components/security/security-setup-otp-dialog-base.svelte';
	import { twoFactorSetupOtpConfirmSchema } from '$lib/shared/schemas/security';
	import type { PageData } from '../../../routes/(app)/(settings)/security/two-factor/$types';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { formFieldProxy, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let {
		open = $bindable(false),
		confirmForm,
		codeSent = $bindable(false),
		onBackupCodes
	}: {
		open?: boolean;
		confirmForm: PageData['confirmSmsForm'];
		codeSent?: boolean;
		onBackupCodes: (codes: string[]) => void;
	} = $props();

	let submitting = $state(false);

	const superform = superForm(untrack(() => confirmForm), {
		id: 'confirmSmsForm',
		validators: zod4Client(twoFactorSetupOtpConfirmSchema),
		validationMethod: 'submit-only',
		onSubmit: () => {
			submitting = true;
		},
		onResult: async ({ result }) => {
			submitting = false;

			if (result.type === 'success' && result.data?.backupCodes?.length) {
				onBackupCodes(result.data.backupCodes as string[]);
			}

			if (result.type === 'success') {
				await invalidateAll();
				open = false;
			}
		},
		onError: () => {
			submitting = false;
		}
	});

	const { value: codeField } = formFieldProxy(superform, 'code');
</script>

<SecuritySetupOtpDialogBase
	bind:open
	bind:submitting
	method="sms"
	confirmAction="?/confirmSmsSetup"
	sendAction="?/sendSmsSetupCode"
	bind:codeSent
	{superform}
	{codeField}
/>
