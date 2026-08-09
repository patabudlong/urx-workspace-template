import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MIN_SECRET_LENGTH = 32;
const ENV_PATH = resolve(process.cwd(), '.env');
const TOKEN_TTL_DAYS = 7;

function generateSecret(): string {
	return randomBytes(48).toString('base64url');
}

function isValidSecret(value: string | undefined): boolean {
	return Boolean(value && value.length >= MIN_SECRET_LENGTH);
}

function parseEnvLine(line: string): { key: string; value: string } | null {
	const trimmed = line.trim();

	if (!trimmed || trimmed.startsWith('#')) {
		return null;
	}

	const eq = trimmed.indexOf('=');

	if (eq === -1) {
		return null;
	}

	return {
		key: trimmed.slice(0, eq).trim(),
		value: trimmed.slice(eq + 1).trim()
	};
}

function upsertEnvVar(content: string, key: string, value: string): string {
	const lines = content.split('\n');
	let found = false;

	const updated = lines.map((line) => {
		const parsed = parseEnvLine(line);

		if (parsed?.key === key) {
			found = true;
			return `${key}=${value}`;
		}

		return line;
	});

	if (!found) {
		updated.push(`${key}=${value}`);
	}

	return updated.join('\n').replace(/\n?$/, '\n');
}

function getEnvVar(content: string, key: string): string | undefined {
	for (const line of content.split('\n')) {
		const parsed = parseEnvLine(line);

		if (parsed?.key === key) {
			return parsed.value;
		}
	}

	return undefined;
}

function maskSecret(secret: string): string {
	if (secret.length <= 8) {
		return '********';
	}

	return `${secret.slice(0, 4)}…${secret.slice(-4)}`;
}

function main() {
	const dryRun = process.argv.includes('--dry-run');

	if (!existsSync(ENV_PATH)) {
		console.error('.env not found. Copy .env.example to .env first.');
		process.exit(1);
	}

	const content = readFileSync(ENV_PATH, 'utf8');
	const currentSecret = getEnvVar(content, 'JWT_SECRET');

	if (!isValidSecret(currentSecret)) {
		console.error(
			`JWT_SECRET must exist in .env and be at least ${MIN_SECRET_LENGTH} characters before rotation.`
		);
		process.exit(1);
	}

	const newSecret = generateSecret();
	const previousSecret = currentSecret;

	console.log('JWT secret rotation');
	console.log('──────────────────');
	console.log(`Current JWT_SECRET:     ${maskSecret(currentSecret!)}`);
	console.log(`New JWT_SECRET:         ${maskSecret(newSecret)}`);
	console.log(`JWT_SECRET_PREVIOUS → ${maskSecret(previousSecret!)}`);
	console.log('');
	console.log(
		`Existing sessions stay valid for up to ${TOKEN_TTL_DAYS} days (access token TTL).`
	);
	console.log(
		`After that, remove JWT_SECRET_PREVIOUS from .env or run this script again.`
	);

	if (dryRun) {
		console.log('');
		console.log('Dry run — .env was not modified.');
		return;
	}

	let updated = upsertEnvVar(content, 'JWT_SECRET_PREVIOUS', previousSecret!);
	updated = upsertEnvVar(updated, 'JWT_SECRET', newSecret);

	writeFileSync(ENV_PATH, updated, 'utf8');

	console.log('');
	console.log('Updated .env');
	console.log('Restart the dev server (pnpm dev) so the app loads the new secrets.');
}

main();
