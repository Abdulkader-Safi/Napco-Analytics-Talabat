import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './server/db';
import { admin } from 'better-auth/plugins';

export const auth = betterAuth({
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 5
	},
	database: drizzleAdapter(db, {
		provider: 'pg'
	}),
	plugins: [admin()]
});
