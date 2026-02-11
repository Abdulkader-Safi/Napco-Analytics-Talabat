import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { auth } from '$lib/auth';

export const load: PageServerLoad = async () => {
	redirect(302, '/campaigns');
};

export const actions: Actions = {
	logout: async ({ request, cookies }) => {
		const result = await auth.api.signOut({
			headers: request.headers,
			asResponse: true
		});

		// Clear cookies from better-auth response
		const setCookies = result.headers.getSetCookie();
		for (const cookie of setCookies) {
			const [nameValue, ...attributes] = cookie.split(';');
			const [name, value] = nameValue.split('=');
			const options: {
				path: string;
				httpOnly?: boolean;
				secure?: boolean;
				sameSite?: 'lax' | 'strict' | 'none';
				maxAge?: number;
			} = { path: '/' };

			for (const attr of attributes) {
				const [key, val] = attr.trim().split('=');
				const lowerKey = key.toLowerCase();
				if (lowerKey === 'httponly') options.httpOnly = true;
				if (lowerKey === 'secure') options.secure = true;
				if (lowerKey === 'samesite')
					options.sameSite = val?.toLowerCase() as 'lax' | 'strict' | 'none';
				if (lowerKey === 'max-age') options.maxAge = parseInt(val);
				if (lowerKey === 'path') options.path = val;
			}

			cookies.set(name, decodeURIComponent(value), options);
		}

		redirect(303, '/auth/login');
	}
};
