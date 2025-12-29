import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { auth } from '$lib/auth';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirm_password') as string;

		if (!username || !email || !password || !confirmPassword) {
			return fail(400, {
				error: 'Please fill in all fields',
				username,
				email
			});
		}

		if (password !== confirmPassword) {
			return fail(400, {
				error: 'Passwords do not match',
				username,
				email
			});
		}

		const result = await auth.api.signUpEmail({
			body: {
				email,
				password,
				name: username
			},
			asResponse: true
		});

		if (!result.ok) {
			const errorData = await result.json();
			return fail(400, {
				error: errorData.message || 'Registration failed',
				username,
				email
			});
		}

		// Set cookies from better-auth response
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

		redirect(303, '/');
	}
};
