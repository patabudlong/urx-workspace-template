import type { RecaptchaAction } from '$lib/shared/recaptcha';
import { createRecaptchaSubmitHandler } from '$lib/recaptcha/client';
import type { SuperForm, SuperValidated } from 'sveltekit-superforms';

type ValidateForm = SuperForm<Record<string, unknown>>['validateForm'];

type AuthSubmitContext = {
	cancel: () => void;
	formData: FormData;
};

export function createAuthFormOnSubmit(options: {
	getValidateForm: () => ValidateForm;
	recaptchaAction: RecaptchaAction;
	onRecaptchaError: (message: string) => void;
	onBeforeSubmit?: () => void;
}) {
	return async (input: AuthSubmitContext) => {
		options.onBeforeSubmit?.();

		const validation = await options.getValidateForm()({ update: true });

		if (!validation.valid) {
			input.cancel();
			return;
		}

		await createRecaptchaSubmitHandler(options.recaptchaAction, options.onRecaptchaError)(input);
	};
}

export type AuthFormData<T extends Record<string, unknown>> = {
	form: SuperValidated<T>;
	redirectTo: string;
};
