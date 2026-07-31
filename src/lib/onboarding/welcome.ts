export const ONBOARDING_WELCOME_DISMISSED_KEY = 'urx-onboarding-welcome-dismissed';

export function hasDismissedOnboardingWelcome(): boolean {
	if (typeof localStorage === 'undefined') {
		return false;
	}

	return localStorage.getItem(ONBOARDING_WELCOME_DISMISSED_KEY) === '1';
}

export function dismissOnboardingWelcome(): void {
	if (typeof localStorage === 'undefined') {
		return;
	}

	localStorage.setItem(ONBOARDING_WELCOME_DISMISSED_KEY, '1');
}
