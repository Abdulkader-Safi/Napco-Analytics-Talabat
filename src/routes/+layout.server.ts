import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, url }) => {
	const isAuthRoute = url.pathname.startsWith('/auth');

	// Redirect to login if not authenticated (except for auth routes)
	if (!locals.user && !isAuthRoute) {
		throw redirect(302, '/auth/login');
	}

	return {
		user: locals.user
			? {
					name: locals.user.name,
					email: locals.user.email,
					image: locals.user.image ?? null,
					role: locals.user.role ?? 'user'
				}
			: null
	};
};
