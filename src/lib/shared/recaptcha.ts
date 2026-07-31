import { z } from 'zod';

export const RECAPTCHA_ACTIONS = {
	LOGIN: 'login',
	SIGNUP: 'signup',
	FORGOT_PASSWORD: 'forgot_password',
	RESET_PASSWORD: 'reset_password',
	RESEND_VERIFICATION: 'resend_verification',
	VERIFY_EMAIL: 'verify_email'
} as const;

export type RecaptchaAction = (typeof RECAPTCHA_ACTIONS)[keyof typeof RECAPTCHA_ACTIONS];

export const recaptchaTokenSchema = z.string().trim().optional();

export const DEFAULT_RECAPTCHA_MIN_SCORE = 0.5;
