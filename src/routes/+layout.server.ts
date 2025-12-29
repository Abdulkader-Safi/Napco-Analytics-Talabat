export function load({ locals }) {
	return {
		name: locals.user?.name || 'Guest'
	};
}
