import type { AppNavItem } from '$lib/navigation/app-nav';
import { SOLAR } from '$lib/icons/solar-icons';

export const SMS_NAV_ITEMS: AppNavItem[] = [
	{
		title: 'Overview',
		href: '/sms',
		icon: SOLAR.sms,
		match: 'exact'
	},
	{
		title: 'Send message',
		href: '/sms/send',
		icon: SOLAR.sms,
		match: 'exact'
	},
	{
		title: 'Message log',
		href: '/sms/messages',
		icon: SOLAR.activity,
		match: 'exact'
	}
];
