import type { AppNavItem } from '$lib/navigation/app-nav';
import MailIcon from '@lucide/svelte/icons/mail';
import SignatureIcon from '@lucide/svelte/icons/signature';

export const MAILBOX_SETTINGS_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Connection',
		href: '/mailbox/settings/connection',
		icon: MailIcon,
		match: 'exact'
	},
	{
		title: 'Signature',
		href: '/mailbox/settings/signature',
		icon: SignatureIcon,
		match: 'exact'
	}
];
