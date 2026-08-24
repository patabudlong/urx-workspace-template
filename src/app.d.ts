declare global {
	namespace App {
		interface Locals {
			user?: {
				id: string;
				email: string;
			};
		}
		interface PageData {
			user?: {
				id: string;
				email: string;
			};
		}
		namespace Superforms {
			type Message = import('$lib/shared/auth-messages').AuthFormMessage;
		}
	}

	namespace svelteHTML {
		interface IntrinsicElements {
			'iconify-icon': {
				icon?: string;
				class?: string;
				width?: string | number;
				height?: string | number;
				'aria-hidden'?: boolean | 'true' | 'false';
			};
		}
	}
}

export {};
