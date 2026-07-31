export const APP_NAME = 'Urixoft Workspace';

export function formatPageTitle(pageTitle?: string): string {
	if (!pageTitle || pageTitle === APP_NAME) {
		return APP_NAME;
	}

	return `${pageTitle} · ${APP_NAME}`;
}
