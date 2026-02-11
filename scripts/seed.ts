import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client, { schema });

const auth = betterAuth({
	emailAndPassword: { enabled: true },
	database: drizzleAdapter(db, { provider: 'pg', schema }),
	plugins: [admin()]
});

const { user } = schema;

async function seed() {
	const email = 'safi@dsrpt.com.au';

	// Check if user already exists
	const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
	if (existing.length > 0) {
		console.log(`User ${email} already exists, updating role to admin...`);
		await db.update(user).set({ role: 'admin' }).where(eq(user.email, email));
		console.log('Done.');
		await client.end();
		return;
	}

	// Create user via better-auth
	const result = await auth.api.signUpEmail({
		body: {
			email,
			password: 'Safi@2020',
			name: 'Safi'
		}
	});

	if (!result?.user?.id) {
		console.error('Failed to create user');
		await client.end();
		process.exit(1);
	}

	// Set role to admin
	await db.update(user).set({ role: 'admin' }).where(eq(user.id, result.user.id));

	console.log(`Admin user created: ${email}`);
	await client.end();
}

seed().catch((err) => {
	console.error('Seed failed:', err);
	client.end().then(() => process.exit(1));
});
