import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PH_DEDUCTION_ICON_PREFIX } from '../src/lib/shared/payroll/deduction-icon-names.ts';
import { ensurePublicPayrollDeductionIconsPolicy } from '../src/lib/server/storage/linode-bucket-policy.ts';
import { parseLinodeObjectStorageConfig } from '../src/lib/server/storage/linode-config.ts';
import { loadEnvFile } from './load-env.ts';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const CONTENT_TYPES: Record<string, string> = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
	'.svg': 'image/svg+xml',
	'.gif': 'image/gif'
};

function createS3Client(config: NonNullable<ReturnType<typeof parseLinodeObjectStorageConfig>>) {
	return new S3Client({
		region: config.region,
		endpoint: config.endpoint,
		credentials: {
			accessKeyId: config.accessKey,
			secretAccessKey: config.secretKey
		},
		forcePathStyle: false
	});
}

async function main() {
	const envPath = loadEnvFile();

	if (!envPath) {
		console.warn('No .env file found — using process environment.');
	}

	const config = parseLinodeObjectStorageConfig(process.env);

	if (!config) {
		console.error(
			'Linode Object Storage is not configured. Set LINODE_ENDPOINT, LINODE_BUCKET, LINODE_ACCESS_KEY, LINODE_SECRET_KEY, and LINODE_PUBLIC_BASE in .env.'
		);
		process.exit(1);
	}

	const assetsDir = join(ROOT_DIR, 'static', PH_DEDUCTION_ICON_PREFIX);
	const files = readdirSync(assetsDir).filter((file) => !file.startsWith('.'));

	if (files.length === 0) {
		console.error(`No files found in ${assetsDir}`);
		process.exit(1);
	}

	const client = createS3Client(config);

	console.log(
		`Ensuring public read policy for ${config.bucket}/${PH_DEDUCTION_ICON_PREFIX}/*`
	);
	await ensurePublicPayrollDeductionIconsPolicy(client, config);

	console.log(
		`Uploading ${files.length} PH deduction icons to ${config.publicBase}/${PH_DEDUCTION_ICON_PREFIX}/`
	);

	for (const file of files) {
		const body = readFileSync(join(assetsDir, file));
		const contentType = CONTENT_TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream';
		const key = `${PH_DEDUCTION_ICON_PREFIX}/${file}`;

		await client.send(
			new PutObjectCommand({
				Bucket: config.bucket,
				Key: key,
				Body: body,
				ContentType: contentType,
				CacheControl: 'public, max-age=31536000, immutable'
			})
		);

		console.log(`  ${file} -> ${config.publicBase}/${key}`);
	}

	console.log('Done.');
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
