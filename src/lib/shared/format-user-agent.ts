/** Human-readable browser + OS label for security notification emails. */
export function formatUserAgentLabel(userAgent: string | undefined): string {
	const ua = userAgent?.trim();

	if (!ua) {
		return 'Unknown device';
	}

	const browser = detectBrowser(ua);
	const os = detectOs(ua);

	if (browser === 'Unknown browser' && os === 'Unknown OS') {
		return 'Unknown device';
	}

	if (browser === 'Unknown browser') {
		return os;
	}

	if (os === 'Unknown OS') {
		return browser;
	}

	return `${browser} on ${os}`;
}

function detectBrowser(ua: string): string {
	if (/Edg\//i.test(ua)) {
		return 'Microsoft Edge';
	}

	if (/OPR\//i.test(ua) || /Opera/i.test(ua)) {
		return 'Opera';
	}

	if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) {
		return 'Chrome';
	}

	if (/Firefox\//i.test(ua)) {
		return 'Firefox';
	}

	if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
		return 'Safari';
	}

	return 'Unknown browser';
}

function detectOs(ua: string): string {
	if (/iPhone|iPad|iPod/i.test(ua)) {
		return 'iOS';
	}

	if (/Android/i.test(ua)) {
		return 'Android';
	}

	if (/Windows/i.test(ua)) {
		return 'Windows';
	}

	if (/Mac OS X|Macintosh/i.test(ua)) {
		return 'macOS';
	}

	if (/Linux/i.test(ua)) {
		return 'Linux';
	}

	return 'Unknown OS';
}
