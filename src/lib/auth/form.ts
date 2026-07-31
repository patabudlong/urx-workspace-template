import type { RecaptchaAction } from '$lib/shared/recaptcha';
import { createRecaptchaSubmitHandler } from '$lib/recaptcha/client';
import type { SuperForm, SuperValidated } from 'sveltekit-superforms';
import type { ZodType } from 'zod';

type ValidateForm = SuperForm<Record<string, unknown>>['validateForm'];

type AuthSubmitContext = {
	cancel: () => void;
	formData: FormData;
};

/**
 * Auth submit gate:
 * 1. Sync Zod check (no await) — invalid forms never show loading and never POST
 * 2. Update field errors via validateForm when invalid
 * 3. Only then flip busy + run reCAPTCHA
 */
export function createAuthFormOnSubmit<T extends Record<string, unknown>>(options: {
	getFormData: () => T;
	clientSchema: ZodType<T>;
	getValidateForm: () => ValidateForm;
	recaptchaAction: RecaptchaAction;
	onRecaptchaError: (message: string) => void;
	onBeforeSubmit?: () => void;
	onAuthBusyChange?: (busy: boolean) => void;
	onLoadingReset?: () => void;
}) {
	return async (input: AuthSubmitContext) => {
		options.onBeforeSubmit?.();

		const parsed = options.clientSchema.safeParse(options.getFormData());

		if (!parsed.success) {
			await options.getValidateForm()({ update: true });
			input.cancel();
			return;
		}

		options.onAuthBusyChange?.(true);

		await createRecaptchaSubmitHandler(options.recaptchaAction, (message) => {
			options.onRecaptchaError(message);
			options.onAuthBusyChange?.(false);
			options.onLoadingReset?.();
		})(input);
	};
}

export type AuthFormData<T extends Record<string, unknown>> = {
	form: SuperValidated<T>;
	redirectTo: string;
};
