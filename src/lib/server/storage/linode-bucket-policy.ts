import {
	GetBucketPolicyCommand,
	PutBucketPolicyCommand,
	type S3Client
} from '@aws-sdk/client-s3';
import type { LinodeObjectStorageConfig } from '$lib/server/storage/linode-config';

const EMAIL_ASSETS_POLICY_SID = 'PublicReadEmailAssets';

type BucketPolicyDocument = {
	Version: string;
	Statement: Array<Record<string, unknown>>;
};

function buildEmailAssetsPolicyStatement(bucket: string, prefix: string) {
	return {
		Sid: EMAIL_ASSETS_POLICY_SID,
		Effect: 'Allow',
		Principal: '*',
		Action: 's3:GetObject',
		Resource: `arn:aws:s3:::${bucket}/${prefix}/*`
	};
}

function isNoSuchBucketPolicyError(error: unknown): boolean {
	if (!error || typeof error !== 'object') {
		return false;
	}

	const name = 'name' in error ? String(error.name) : '';
	const code = 'Code' in error ? String(error.Code) : '';

	return (
		name === 'NoSuchBucketPolicy' ||
		code === 'NoSuchBucketPolicy' ||
		name === 'NoSuchBucketPolicyError'
	);
}

/**
 * Linode Object Storage does not support per-object ACLs.
 * Email images must be readable anonymously via a bucket policy on `{prefix}/*`.
 */
export async function ensurePublicEmailAssetsPolicy(
	client: S3Client,
	config: LinodeObjectStorageConfig,
	prefix: string
): Promise<void> {
	const statement = buildEmailAssetsPolicyStatement(config.bucket, prefix);
	let policy: BucketPolicyDocument;

	try {
		const existing = await client.send(new GetBucketPolicyCommand({ Bucket: config.bucket }));
		policy = JSON.parse(existing.Policy ?? '{}') as BucketPolicyDocument;
		const statements = Array.isArray(policy.Statement)
			? policy.Statement
			: policy.Statement
				? [policy.Statement]
				: [];
		const index = statements.findIndex((entry) => entry.Sid === EMAIL_ASSETS_POLICY_SID);

		if (index >= 0) {
			statements[index] = statement;
		} else {
			statements.push(statement);
		}

		policy = {
			Version: policy.Version ?? '2012-10-17',
			Statement: statements
		};
	} catch (error) {
		if (!isNoSuchBucketPolicyError(error)) {
			throw error;
		}

		policy = {
			Version: '2012-10-17',
			Statement: [statement]
		};
	}

	await client.send(
		new PutBucketPolicyCommand({
			Bucket: config.bucket,
			Policy: JSON.stringify(policy)
		})
	);
}
