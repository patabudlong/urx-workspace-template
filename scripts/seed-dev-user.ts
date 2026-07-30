import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const DEFAULT_EMAIL = 'admin@urx.local';
const DEFAULT_PASSWORD = 'changeme123';
const DEFAULT_NAME = 'Admin';

async function main() {
	const uri = process.env.MONGODB_URI;
	const dbName = process.env.MONGODB_DB_NAME ?? 'urx-workspace';

	if (!uri) {
		console.error('MONGODB_URI is not set. Copy .env.example to .env and start Docker Mongo.');
		process.exit(1);
	}

	const email = process.env.SEED_USER_EMAIL ?? DEFAULT_EMAIL;
	const password = process.env.SEED_USER_PASSWORD ?? DEFAULT_PASSWORD;
	const name = process.env.SEED_USER_NAME ?? DEFAULT_NAME;

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
						name,
						updatedAt: now
					}
				}
			);
			console.log(`Updated dev user: ${normalizedEmail}`);
		} else {
			await users.insertOne({
				email: normalizedEmail,
				passwordHash,
				name,
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
