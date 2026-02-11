import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { reports, sellout } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const [reportsCount, selloutCount] = await Promise.all([
		db.select({ count: sql<number>`COUNT(*)` }).from(reports),
		db.select({ count: sql<number>`COUNT(*)` }).from(sellout)
	]);

	return {
		reportsCount: Number(reportsCount[0].count),
		selloutCount: Number(selloutCount[0].count)
	};
};
