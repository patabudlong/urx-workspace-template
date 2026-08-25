export type HttpErrorAction = {
	label: string;
	href: string;
	variant?: 'default' | 'outline';
	method?: 'GET' | 'POST';
};

export type HttpErrorPresentation = {
	title: string;
	description: string;
	primaryAction: HttpErrorAction;
	secondaryAction?: HttpErrorAction;
	hint?: string;
};

function isAdminPath(pathname: string): boolean {
	return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function getHttpErrorPresentation(
	status: number,
	options: {
		message?: string;
		pathname?: string;
	} = {}
): HttpErrorPresentation {
	const { message, pathname = '' } = options;

	if (status === 403) {
		if (isAdminPath(pathname)) {
			return {
				title: 'Access denied',
				description:
					message ??
					'You need platform admin access to view workspace requests and other admin tools.',
				primaryAction: { label: 'Go to dashboard', href: '/' },
				secondaryAction: {
					label: 'Sign in with another account',
					href: '/logout',
					variant: 'outline',
					method: 'POST'
				}
			};
		}

		return {
			title: 'Access denied',
			description: message ?? "You don't have permission to view this page.",
			primaryAction: { label: 'Go to dashboard', href: '/' }
		};
	}

	if (status === 404) {
		return {
			title: 'Page not found',
			description: message ?? "The page you're looking for doesn't exist or was moved.",
			primaryAction: { label: 'Go to dashboard', href: '/' }
		};
	}

	if (status >= 500) {
		return {
			title: "We couldn't complete your request",
			description:
				message ??
				'A temporary issue prevented us from loading this page. Your data is safe — please try again in a moment.',
			primaryAction: { label: 'Go to dashboard', href: '/' },
			secondaryAction: { label: 'Try again', href: pathname || '/' },
			hint: 'If this keeps happening, contact your workspace administrator.'
		};
	}

	return {
		title: 'Something went wrong',
		description: message ?? 'An unexpected error occurred. Please try again in a moment.',
		primaryAction: { label: 'Go to dashboard', href: '/' },
		secondaryAction: { label: 'Try again', href: pathname || '/' }
	};
}
