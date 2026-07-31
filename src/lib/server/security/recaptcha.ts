import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import {
	DEFAULT_RECAPTCHA_MIN_SCORE,
	type RecaptchaAction
} from '$lib/shared/recaptcha';

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

type GoogleRecaptchaResponse = {
	success: boolean;
	score?: number;
	action?: string;
	'error-codes'?: string[];
};

export type RecaptchaVerifyResult =
	| { ok: true; score: number; action: string }
	| {
			ok: false;
			reason:
				| 'NOT_CONFIGURED'
				| 'MISSING_TOKEN'
				| 'VERIFICATION_FAILED'
				| 'LOW_SCORE'
				| 'ACTION_MISMATCH';
	  };

export function isRecaptchaEnabled(): boolean {
	return Boolean(
		privateEnv.RECAPTCHA_SECRET_KEY?.trim() && publicEnv.PUBLIC_RECAPTCHA_SITE_KEY?.trim()
	);
}

function getMinScore(): number {
	const configured = Number(privateEnv.RECAPTCHA_MIN_SCORE);

	if (Number.isFinite(configured) && configured >= 0 && configured <= 1) {
		return configured;
	}

	return DEFAULT_RECAPTCHA_MIN_SCORE;
}

export async function verifyRecaptchaToken(input: {
	token: string | undefined;
	expectedAction: RecaptchaAction;
	remoteIp?: string | null;
}): Promise<RecaptchaVerifyResult> {
	if (!isRecaptchaEnabled()) {
		return { ok: false, reason: 'NOT_CONFIGURED' };
	}

	if (!input.token?.trim()) {
		return { ok: false, reason: 'MISSING_TOKEN' };
	}

	const body = new URLSearchParams({
		secret: privateEnv.RECAPTCHA_SECRET_KEY!.trim(),
		response: input.token.trim()
	});

	if (input.remoteIp) {
		body.set('remoteip', input.remoteIp);
	}

	let payload: GoogleRecaptchaResponse;

	try {
		const response = await fetch(VERIFY_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body
		});

		if (!response.ok) {
			return { ok: false, reason: 'VERIFICATION_FAILED' };
		}

		payload = (await response.json()) as GoogleRecaptchaResponse;
	} catch {
		return { ok: false, reason: 'VERIFICATION_FAILED' };
	}

	if (!payload.success) {
		return { ok: false, reason: 'VERIFICATION_FAILED' };
	}

	const score = payload.score ?? 0;

	if (score < getMinScore()) {
		return { ok: false, reason: 'LOW_SCORE' };
	}

	if (payload.action !== input.expectedAction) {
		return { ok: false, reason: 'ACTION_MISMATCH' };
	}

	return {
		ok: true,
		score,
		action: payload.action
	};
}

export async function assertAuthRecaptcha(input: {
	token: string | undefined;
	action: RecaptchaAction;
	remoteIp: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
	const result = await verifyRecaptchaToken({
		token: input.token,
		expectedAction: input.action,
		remoteIp: input.remoteIp
	});

	if (result.ok || result.reason === 'NOT_CONFIGURED') {
		return { ok: true };
	}

	return {
		ok: false,
		message: 'Security verification failed. Please try again.'
	};
}
