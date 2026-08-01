import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';

export type LinodeObjectStorageConfig = {
	endpoint: string;
	bucket: string;
	accessKey: string;
	secretKey: string;
	region: string;
	publicBase: string;
};

export function getLinodeObjectStorageConfig(): LinodeObjectStorageConfig | null {
	const endpoint = env.LINODE_ENDPOINT?.trim();
	const bucket = env.LINODE_BUCKET?.trim();
	const accessKey = env.LINODE_ACCESS_KEY?.trim();
	const secretKey = env.LINODE_SECRET_KEY?.trim();
	const region = env.LINODE_REGION?.trim() || 'us-east-1';
	const publicBase = env.LINODE_PUBLIC_BASE?.trim().replace(/\/$/, '');

	if (!endpoint || !bucket || !accessKey || !secretKey || !publicBase) {
		return null;
	}

	return {
		endpoint,
		bucket,
		accessKey,
		secretKey,
		region,
		publicBase
	};
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

	await client.send(
		new PutObjectCommand({
			Bucket: config.bucket,
			Key: key,
			Body: input.body,
			ContentType: input.contentType,
			CacheControl: 'public, max-age=31536000, immutable'
		})
	);

	return `${config.publicBase}/${key}`;
}
