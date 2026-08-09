export type LinodeObjectStorageConfig = {
	endpoint: string;
	bucket: string;
	accessKey: string;
	secretKey: string;
	region: string;
	publicBase: string;
};

export function parseLinodeObjectStorageConfig(
	source: Record<string, string | undefined>
): LinodeObjectStorageConfig | null {
	const endpoint = source.LINODE_ENDPOINT?.trim();
	const bucket = source.LINODE_BUCKET?.trim();
	const accessKey = source.LINODE_ACCESS_KEY?.trim();
	const secretKey = source.LINODE_SECRET_KEY?.trim();
	const region = source.LINODE_REGION?.trim() || 'us-east-1';
	const publicBase = source.LINODE_PUBLIC_BASE?.trim().replace(/\/$/, '');

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
