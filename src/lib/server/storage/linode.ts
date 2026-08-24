import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';
import { ensurePublicWorkspaceBrandLogoPolicy } from '$lib/server/storage/linode-bucket-policy';
import {
	parseLinodeObjectStorageConfig,
	type LinodeObjectStorageConfig
} from '$lib/server/storage/linode-config';

export type { LinodeObjectStorageConfig } from '$lib/server/storage/linode-config';
export { parseLinodeObjectStorageConfig } from '$lib/server/storage/linode-config';

export function getLinodeObjectStorageConfig(): LinodeObjectStorageConfig | null {
	return parseLinodeObjectStorageConfig({
		LINODE_ENDPOINT: env.LINODE_ENDPOINT,
		LINODE_BUCKET: env.LINODE_BUCKET,
		LINODE_ACCESS_KEY: env.LINODE_ACCESS_KEY,
		LINODE_SECRET_KEY: env.LINODE_SECRET_KEY,
		LINODE_REGION: env.LINODE_REGION,
		LINODE_PUBLIC_BASE: env.LINODE_PUBLIC_BASE
	});
}

export function isLinodeObjectStorageConfigured(): boolean {
	return getLinodeObjectStorageConfig() !== null;
}

let s3Client: S3Client | null = null;
let s3ClientSignature = '';

function getS3Client(config: LinodeObjectStorageConfig): S3Client {
	const signature = `${config.endpoint}|${config.region}|${config.accessKey}`;

	if (!s3Client || s3ClientSignature !== signature) {
		s3Client = new S3Client({
			region: config.region,
			endpoint: config.endpoint,
			credentials: {
				accessKeyId: config.accessKey,
				secretAccessKey: config.secretKey
			},
			forcePathStyle: false
		});
		s3ClientSignature = signature;
	}

	return s3Client;
}

export async function uploadPublicObject(
	input: {
		key: string;
		body: Buffer;
		contentType: string;
		cacheControl?: string;
	},
	config?: LinodeObjectStorageConfig
): Promise<string> {
	const resolved = config ?? getLinodeObjectStorageConfig();

	if (!resolved) {
		throw new Error('LINODE_NOT_CONFIGURED');
	}

	const client = getS3Client(resolved);

	await client.send(
		new PutObjectCommand({
			Bucket: resolved.bucket,
			Key: input.key,
			Body: input.body,
			ContentType: input.contentType,
			CacheControl: input.cacheControl ?? 'public, max-age=31536000, immutable'
		})
	);

	return `${resolved.publicBase}/${input.key}`;
}

const LOGO_EXTENSIONS = ['png', 'jpg', 'webp', 'svg'] as const;

export async function getWorkspaceBrandLogoObject(input: {
	slug: string;
	extension: string;
}): Promise<{ body: Buffer; contentType: string } | null> {
	const config = getLinodeObjectStorageConfig();

	if (!config) {
		return null;
	}

	const client = getS3Client(config);
	const key = `workspaces/${input.slug}/logo.${input.extension}`;

	try {
		const response = await client.send(
			new GetObjectCommand({
				Bucket: config.bucket,
				Key: key
			})
		);

		if (!response.Body) {
			return null;
		}

		const body = Buffer.from(await response.Body.transformToByteArray());

		return {
			body,
			contentType: response.ContentType ?? 'application/octet-stream'
		};
	} catch {
		return null;
	}
}

export { LOGO_EXTENSIONS };

export async function uploadPayrollEmployeePhoto(input: {
	workspaceId: string;
	employeeId: string;
	body: Buffer;
	contentType: string;
	extension: string;
}): Promise<string> {
	const config = getLinodeObjectStorageConfig();

	if (!config) {
		throw new Error('LINODE_NOT_CONFIGURED');
	}

	const key = `workspaces/${input.workspaceId}/payroll/employees/${input.employeeId}/photo.${input.extension}`;

	return uploadPublicObject(
		{
			key,
			body: input.body,
			contentType: input.contentType
		},
		config
	);
}

export async function uploadWorkspaceBrandLogo(input: {
	slug: string;
	body: Buffer;
	contentType: string;
	extension: string;
}): Promise<string> {
	const config = getLinodeObjectStorageConfig();

	if (!config) {
		throw new Error('LINODE_NOT_CONFIGURED');
	}

	const key = `workspaces/${input.slug}/logo.${input.extension}`;

	const client = getS3Client(config);
	await ensurePublicWorkspaceBrandLogoPolicy(client, config);

	return uploadPublicObject(
		{
			key,
			body: input.body,
			contentType: input.contentType
		},
		config
	);
}
