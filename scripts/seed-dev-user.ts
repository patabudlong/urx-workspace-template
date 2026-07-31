import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { loadEnvFile } from './load-env.ts';
import { splitFullName } from '../src/lib/shared/user.ts';

const envPath = loadEnvFile();

if (!envPath) {
	console.warn('No .env file found — using process environment and defaults.');
}

const DEFAULT_EMAIL = 'admin@urx.local';
const DEFAULT_PASSWORD = 'changeme123';
const DEFAULT_FIRST_NAME = 'Admin';
const DEFAULT_LAST_NAME = 'User';

function resolveSeedNames(): { firstName: string; lastName: string } {
	if (process.env.SEED_USER_FIRST_NAME || process.env.SEED_USER_LAST_NAME) {
		return {
			firstName: (process.env.SEED_USER_FIRST_NAME ?? DEFAULT_FIRST_NAME).trim(),
			lastName: (process.env.SEED_USER_LAST_NAME ?? DEFAULT_LAST_NAME).trim()
		};
	}

	if (process.env.SEED_USER_NAME) {
		return splitFullName(process.env.SEED_USER_NAME);
	}

	return {
		firstName: DEFAULT_FIRST_NAME,
		lastName: DEFAULT_LAST_NAME
	};
}

async function main() {
	const uri = process.env.MONGODB_URI;
	const dbName = process.env.MONGODB_DB_NAME ?? 'urx-workspace';

	if (!uri) {
		console.error('MONGODB_URI is not set. Copy .env.example to .env and start Docker Mongo.');
		process.exit(1);
	}

	const email = process.env.SEED_USER_EMAIL ?? DEFAULT_EMAIL;
	const password = process.env.SEED_USER_PASSWORD ?? DEFAULT_PASSWORD;
	const { firstName, lastName } = resolveSeedNames();

	console.log(`Seeding user: ${email} (${firstName} ${lastName})`);

	const client = new MongoClient(uri);

	try {
		await client.connect();
		const users = client.db(dbName).collection('users');
		await users.createIndex({ email: 1 }, { unique: true });

		const passwordHash = await bcrypt.hash(password, 12);
		const now = new Date();
		const normalizedEmail = email.trim().toLowerCase();

		const existing = await users.findOne({ email: normalizedEmail });

		if (existing) {
			await users.updateOne(
				{ _id: existing._id },
				{
					$set: {
						passwordHash,
						firstName,
						lastName,
						updatedAt: now
					},
					$unset: {
						name: ''
					}
				}
			);
			console.log(`Updated dev user: ${normalizedEmail}`);
		} else {
			await users.insertOne({
				email: normalizedEmail,
				passwordHash,
				firstName,
				lastName,
				createdAt: now,
				updatedAt: now
			});
			console.log(`Created dev user: ${normalizedEmail}`);
		}

		console.log(`Password: ${password}`);
	} finally {
		await client.close();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
