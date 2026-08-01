const DEFAULT_EMAIL_TIMEZONE = 'Asia/Manila';

/** Human-readable date, time, and timezone for transactional emails. */
export function formatEmailDateTime(
	date: Date,
	timeZone: string = DEFAULT_EMAIL_TIMEZONE
): string {
	return new Intl.DateTimeFormat('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		second: '2-digit',
		timeZone,
		timeZoneName: 'short'
	}).format(date);
}
