export const APP_NAME = 'Urixoft Workspace';

export const URIXOFT_SOCIAL = {
	facebook: 'https://www.facebook.com/urixoft',
	linkedin: 'https://www.linkedin.com/company/urixoft'
} as const;

export function formatPageTitle(pageTitle?: string): string {
	if (!pageTitle || pageTitle === APP_NAME) {
		return APP_NAME;
	}

	return `${pageTitle} · ${APP_NAME}`;
}
