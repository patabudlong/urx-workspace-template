import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import type { RecaptchaAction } from '$lib/shared/recaptcha';
import { SECURITY_VERIFICATION_FAILED_CLIENT_MESSAGE } from '$lib/shared/auth-messages';

declare global {
	interface Window {
		grecaptcha?: {
			ready: (callback: () => void) => void;
			execute: (siteKey: string, options: { action: string }) => Promise<string>;
		};
	}
}

const RECAPTCHA_SCRIPT_ID = 'google-recaptcha-v3';
const LOAD_TIMEOUT_MS = 15_000;
/** Google tokens are valid ~2 minutes; refresh before that. */
const TOKEN_MAX_AGE_MS = 90_000;

let scriptLoadPromise: Promise<void> | null = null;

type TokenEntry = {
	action: RecaptchaAction;
	obtainedAt: number;
	promise: Promise<string>;
};

let tokenEntry: TokenEntry | null = null;

export function getRecaptchaSiteKey(): string | undefined {
	const siteKey = env.PUBLIC_RECAPTCHA_SITE_KEY?.trim();
	return siteKey || undefined;
}

export function isRecaptchaClientEnabled(): boolean {
	return browser && Boolean(getRecaptchaSiteKey());
}

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) => {
			setTimeout(() => reject(new Error(message)), LOAD_TIMEOUT_MS);
		})
	]);
}

function waitForGrecaptchaReady(): Promise<void> {
	return new Promise((resolve, reject) => {
		const grecaptcha = window.grecaptcha;

		if (!grecaptcha) {
			reject(new Error('reCAPTCHA is not available'));
			return;
		}

		grecaptcha.ready(() => resolve());
	});
}

function loadRecaptchaScript(siteKey: string): Promise<void> {
	if (!browser) {
		return Promise.reject(new Error('reCAPTCHA is only available in the browser'));
	}

	if (window.grecaptcha) {
		return waitForGrecaptchaReady();
	}

	if (scriptLoadPromise) {
		return scriptLoadPromise;
	}

	scriptLoadPromise = withTimeout(
		new Promise<void>((resolve, reject) => {
			const existing = document.getElementById(RECAPTCHA_SCRIPT_ID) as HTMLScriptElement | null;

			if (existing) {
				if (window.grecaptcha) {
					waitForGrecaptchaReady().then(resolve).catch(reject);
					return;
				}

				existing.addEventListener(
					'load',
					() => {
						waitForGrecaptchaReady().then(resolve).catch(reject);
					},
					{ once: true }
				);
				existing.addEventListener(
					'error',
					() => reject(new Error('Failed to load reCAPTCHA')),
					{ once: true }
				);
				return;
			}

			const script = document.createElement('script');

			script.id = RECAPTCHA_SCRIPT_ID;
			script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
			script.async = true;
			script.defer = true;
			script.onload = () => {
				waitForGrecaptchaReady().then(resolve).catch(reject);
			};
			script.onerror = () => reject(new Error('Failed to load reCAPTCHA'));

			document.head.appendChild(script);
		}),
		'reCAPTCHA timed out while loading'
	).catch((error) => {
		scriptLoadPromise = null;
		throw error;
	});

	return scriptLoadPromise;
}

async function requestRecaptchaToken(action: RecaptchaAction): Promise<string> {
	const siteKey = getRecaptchaSiteKey();

	if (!siteKey) {
		throw new Error('reCAPTCHA site key is not configured');
	}

	await loadRecaptchaScript(siteKey);

	const grecaptcha = window.grecaptcha;

	if (!grecaptcha) {
		throw new Error('reCAPTCHA is not available');
	}

	return withTimeout(
		grecaptcha.execute(siteKey, { action }),
		'reCAPTCHA timed out while verifying'
	);
}

function isTokenEntryFresh(entry: TokenEntry, action: RecaptchaAction): boolean {
	return entry.action === action && Date.now() - entry.obtainedAt < TOKEN_MAX_AGE_MS;
}

function startTokenFetch(action: RecaptchaAction): TokenEntry {
	const obtainedAt = Date.now();
	const entry: TokenEntry = {
		action,
		obtainedAt,
		promise: requestRecaptchaToken(action).catch((error) => {
			if (tokenEntry?.obtainedAt === obtainedAt) {
				tokenEntry = null;
			}

			throw error;
		})
	};

	tokenEntry = entry;
	return entry;
}

export function preloadRecaptcha(): void {
	const siteKey = getRecaptchaSiteKey();

	if (!siteKey) {
		return;
	}

	void loadRecaptchaScript(siteKey).catch(() => {
		// Preload failures are handled again on submit.
	});
}

/** Remove reCAPTCHA script and badge when leaving auth routes. */
export function cleanupRecaptcha(): void {
	if (!browser) {
		return;
	}

	tokenEntry = null;
	scriptLoadPromise = null;

	document.getElementById(RECAPTCHA_SCRIPT_ID)?.remove();
	document.querySelectorAll('.grecaptcha-badge').forEach((element) => element.remove());
	document.querySelectorAll('iframe[src*="recaptcha"]').forEach((element) => element.remove());

	delete window.grecaptcha;
}

/** Prefetch a token so submit does not wait on grecaptcha.execute. */
export function warmRecaptcha(action: RecaptchaAction): void {
	if (!isRecaptchaClientEnabled()) {
		return;
	}

	if (tokenEntry && isTokenEntryFresh(tokenEntry, action)) {
		return;
	}

	startTokenFetch(action);
}

export async function executeRecaptcha(action: RecaptchaAction): Promise<string> {
	if (!getRecaptchaSiteKey()) {
		throw new Error('reCAPTCHA site key is not configured');
	}

	const existing = tokenEntry && isTokenEntryFresh(tokenEntry, action) ? tokenEntry : startTokenFetch(action);
	const token = await existing.promise;

	if (tokenEntry?.obtainedAt === existing.obtainedAt) {
		tokenEntry = null;
	}

	return token;
}

export const RECAPTCHA_CLIENT_ERROR = SECURITY_VERIFICATION_FAILED_CLIENT_MESSAGE;

export function createRecaptchaSubmitHandler(
	action: RecaptchaAction,
	onError: (message: string) => void
) {
	return async ({
		formData,
		cancel
	}: {
		formData: FormData;
		cancel: () => void;
	}) => {
		if (!isRecaptchaClientEnabled()) {
			return;
		}

		try {
			formData.set('recaptchaToken', await executeRecaptcha(action));
		} catch {
			onError(RECAPTCHA_CLIENT_ERROR);
			cancel();
		}
	};
}
