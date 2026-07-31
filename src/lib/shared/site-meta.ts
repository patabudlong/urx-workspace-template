export const APP_NAME = 'Urixoft Workspace';

export const URIXOFT_WEBSITE = 'https://urixoft.com';

export const URIXOFT_SOCIAL = {
	facebook: 'https://www.facebook.com/profile.php?id=61591756655092',
	linkedin: 'https://www.linkedin.com/company/urixoft'
} as const;

/** Rotating “Your ___ workspace” phrases on the auth marketing panel. */
export const AUTH_WORKSPACE_HEADLINE_ITEMS = [
	{ phrase: 'service business', from: '#bef264', to: '#d9f99d' },
	{ phrase: 'agency operations', from: '#fde68a', to: '#fef08a' },
	{ phrase: 'field services', from: '#6ee7b7', to: '#a7f3d0' },
	{ phrase: 'digital services', from: '#67e8f9', to: '#a5f3fc' },
	{ phrase: 'consulting practice', from: '#c4b5fd', to: '#e9d5ff' },
	{ phrase: 'wellness practice', from: '#fda4af', to: '#fecdd3' },
	{ phrase: 'retail services', from: '#fdba74', to: '#fed7aa' },
	{ phrase: 'client services', from: '#c8e6f7', to: '#ffffff' }
] as const;

export function formatPageTitle(pageTitle?: string): string {
	if (!pageTitle || pageTitle === APP_NAME) {
		return APP_NAME;
	}

	return `${pageTitle} · ${APP_NAME}`;
}
