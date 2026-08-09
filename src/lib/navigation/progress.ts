import type { Navigation } from '@sveltejs/kit';

type NavigationTarget = Pick<Navigation, 'from' | 'to'>;

const MAILBOX_ROUTE_SEGMENT = /^\/mailbox\/([^/]+)(?:\/|$)/;

function getMailboxRouteFolder(pathname: string | undefined): string | null {
	if (!pathname) {
		return null;
	}

	const match = pathname.match(MAILBOX_ROUTE_SEGMENT);
	if (!match) {
		return null;
	}

	const segment = match[1];
	if (segment === 'settings' || segment === 'compose') {
		return null;
	}

	return segment;
}

export function isMailboxMessageListNavigation(nav: NavigationTarget): boolean {
	if (!nav.to) {
		return false;
	}

	const toFolder = getMailboxRouteFolder(nav.to.url.pathname);
	if (!toFolder) {
		return false;
	}

	const fromFolder = getMailboxRouteFolder(nav.from?.url.pathname);
	if (fromFolder !== toFolder) {
		return true;
	}

	return nav.from?.url.searchParams.get('page') !== nav.to.url.searchParams.get('page');
}
