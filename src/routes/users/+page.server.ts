import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { user, account } from '$lib/server/db/schema';
import { auth } from '$lib/auth';
import { eq, and } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/');
	}

	const users = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			createdAt: user.createdAt,
			banned: user.banned
		})
		.from(user);

	return { users };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const role = formData.get('role') as string;

		if (!name || !email || !password) {
			return fail(400, { error: 'Name, email, and password are required', name, email, role });
		}

		try {
			const result = await auth.api.signUpEmail({
				body: { email, password, name },
				asResponse: true
			});

			if (!result.ok) {
				const errorData = await result.json();
				return fail(400, {
					error: errorData.message || 'Failed to create user',
					name,
					email,
					role
				});
			}

			const newUser = await result.json();

			if (role && role !== 'user' && newUser.user?.id) {
				await db.update(user).set({ role }).where(eq(user.id, newUser.user.id));
			}
		} catch (err) {
			return fail(500, {
				error: 'An unexpected error occurred',
				name,
				email,
				role
			});
		}

		return { success: true };
	},

	update: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { editError: 'Unauthorized' });
		}

		const formData = await request.formData();
		const id = formData.get('id') as string;
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const role = formData.get('role') as string;
		const banned = formData.get('banned') === 'true';

		if (!id || !name || !email) {
			return fail(400, { editError: 'Name and email are required', editId: id });
		}

		try {
			// Update user fields
			await db
				.update(user)
				.set({ name, email, role: role || 'user', banned })
				.where(eq(user.id, id));

			// Update password if provided
			if (password) {
				const hashedPassword = await hashPassword(password);
				await db
					.update(account)
					.set({ password: hashedPassword })
					.where(and(eq(account.userId, id), eq(account.providerId, 'credential')));
			}
		} catch (err) {
			return fail(500, { editError: 'An unexpected error occurred', editId: id });
		}

		return { editSuccess: true };
	}
};
