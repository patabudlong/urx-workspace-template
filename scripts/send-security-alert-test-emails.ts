import { MongoClient, ObjectId } from 'mongodb';
import nodemailer from 'nodemailer';
import { loadEnvFile } from './load-env.ts';
import { buildSecurityAlertEmailHtml, buildSecurityAlertEmailText } from '../src/lib/server/mail/templates/security-alert-email.ts';
import { resolveMongoDbName, resolveMongoUri } from '../src/lib/server/db/resolve-mongo-uri.ts';
import { parseLinodeObjectStorageConfig } from '../src/lib/server/storage/linode-config.ts';
import { formatEmailDateTime } from '../src/lib/shared/format-datetime.ts';
import { formatUserAgentLabel } from '../src/lib/shared/format-user-agent.ts';
import { EMAIL_ASSET_PREFIX, EMAIL_ASSET_CACHE_VERSIONS, EMAIL_ASSETS } from '../src/lib/shared/mail/email-asset-names.ts';
import {
	resolveSecurityEmailCopy,
	SECURITY_EMAIL_KINDS,
	SECURITY_EMAIL_LEVELS
} from '../src/lib/shared/mail/security-alert-email.ts';

const TEST_CASES = [
	{
		level: SECURITY_EMAIL_LEVELS.WARNING,
		kind: SECURITY_EMAIL_KINDS.UNUSUAL_LOGIN,
		label: 'Warning — unusual sign-in'
	},
	{
		level: SECURITY_EMAIL_LEVELS.ALERT,
		kind: SECURITY_EMAIL_KINDS.PASSWORD_CHANGED,
		label: 'Alert — password changed'
	},
	{
		level: SECURITY_EMAIL_LEVELS.ALERT,
		kind: SECURITY_EMAIL_KINDS.PASSWORD_RESET_COMPLETED,
		label: 'Alert — password reset completed'
	},
	{
		level: SECURITY_EMAIL_LEVELS.ALERT,
		kind: SECURITY_EMAIL_KINDS.TWO_FACTOR_DISABLED,
		label: 'Alert — two-factor disabled'
	}
] as const;

function resolveSmtpConfig() {
	const host = process.env.SMTP_HOST?.trim();
	const port = Number(process.env.SMTP_PORT ?? '587');
	const from = process.env.SMTP_FROM?.trim();

	if (!host || !from || Number.isNaN(port)) {
		return null;
	}

	return { host, port, from };
}

function resolveEmailAssetUrl(filename: string, origin: string): string {
	const linode = parseLinodeObjectStorageConfig(process.env);

	if (linode) {
		const base = `${linode.publicBase}/${EMAIL_ASSET_PREFIX}/${filename}`;
		const version = EMAIL_ASSET_CACHE_VERSIONS[filename];

		return version ? `${base}?v=${version}` : base;
	}

	return `${origin.replace(/\/$/, '')}/${EMAIL_ASSET_PREFIX}/${filename}`;
}

function buildSecureAccountUrl(origin: string, kind: (typeof TEST_CASES)[number]['kind']): string {
	const path =
		kind === SECURITY_EMAIL_KINDS.UNUSUAL_LOGIN ? '/security/activity' : '/security';
	const loginOrigin = process.env.GOOGLE_OAUTH_ORIGIN?.trim() ?? origin.replace(/\/$/, '');

	return `${loginOrigin}/login?redirectTo=${encodeURIComponent(path)}`;
}

async function main() {
	const envPath = loadEnvFile();

	if (!envPath) {
		console.warn('No .env file found — using process environment.');
	}

	const smtp = resolveSmtpConfig();

	if (!smtp) {
		console.error('Mail is not configured. Set SMTP_HOST, SMTP_PORT, and SMTP_FROM in .env.');
		process.exit(1);
	}

	const email = (process.env.TEST_SECURITY_ALERT_EMAIL ?? process.env.SEED_USER_EMAIL ?? 'superadmin@urixoft.com')
		.trim()
		.toLowerCase();
	const origin =
		process.env.TEST_SECURITY_ALERT_ORIGIN?.trim() ??
		process.env.PLATFORM_WORKSPACE_ORIGIN?.trim() ??
		'http://workspace.localhost:5173';

	const { uri } = resolveMongoUri(process.env);
	const dbName = resolveMongoDbName(process.env);
	const client = new MongoClient(uri);

	await client.connect();

	try {
		const user = await client.db(dbName).collection('users').findOne(
			{ email },
			{ projection: { email: 1, firstName: 1 } }
		);

		if (!user?._id || !user.email) {
			console.error(`No user found for ${email}. Run pnpm seed:user or set TEST_SECURITY_ALERT_EMAIL.`);
			process.exit(1);
		}

		const transporter = nodemailer.createTransport({
			host: smtp.host,
			port: smtp.port,
			secure: smtp.port === 465,
			ignoreTLS: smtp.port === 1025
		});

		const greeting = typeof user.firstName === 'string' && user.firstName.trim()
			? user.firstName.trim()
			: 'there';
		const occurredAtLabel = formatEmailDateTime(new Date());
		const ipAddress = '203.177.42.10';
		const userAgent =
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
		const deviceLabel = formatUserAgentLabel(userAgent);
		const logoUrl = resolveEmailAssetUrl(EMAIL_ASSETS.logo, origin);
		const illustrationUrl = resolveEmailAssetUrl(EMAIL_ASSETS.securityAlert, origin);

		console.log(`Sending ${TEST_CASES.length} security alert test emails to ${user.email}`);
		console.log(`Origin: ${origin}`);

		for (const testCase of TEST_CASES) {
			const copy = resolveSecurityEmailCopy({
				level: testCase.level,
				kind: testCase.kind
			});
			const content = {
				level: testCase.level,
				kind: testCase.kind,
				greeting,
				occurredAtLabel,
				ipAddress,
				deviceLabel,
				secureAccountUrl: buildSecureAccountUrl(origin, testCase.kind),
				logoUrl,
				illustrationUrl
			};

			await transporter.sendMail({
				from: smtp.from,
				to: user.email,
				subject: `[TEST] ${copy.subject}`,
				text: buildSecurityAlertEmailText(content),
				html: buildSecurityAlertEmailHtml(content)
			});

			console.log(`  Sent: ${testCase.label}`);
		}

		console.log('Done. Check MailHog at http://localhost:8025 if using local SMTP.');
	} finally {
		await client.close();
	}
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
