import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { reports } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const keywordFilter = url.searchParams.get('keyword') || null;
	const campaignFilter = url.searchParams.get('campaign') || null;

	const conditions = [sql`${reports.productName} IS NOT NULL AND ${reports.productName} != ''`];
	if (keywordFilter) conditions.push(sql`${reports.keyword} = ${keywordFilter}`);
	if (campaignFilter) conditions.push(sql`${reports.campaignId} = ${campaignFilter}`);

	const products = await db
		.select({
			productId: reports.productId,
			productName: reports.productName,
			category: sql<string>`MAX(${reports.category}) FILTER (WHERE ${reports.category} IS NOT NULL AND ${reports.category} != '')`,
			currency: reports.currency,
			avgRoas: sql<number>`CASE WHEN SUM(${reports.totalAdSpend}) > 0 THEN (SUM(${reports.salesRevenue}) / SUM(${reports.totalAdSpend})) * 100 ELSE 0 END`,
			impressions: sql<number>`SUM(${reports.impressions})`,
			totalClicks: sql<number>`SUM(${reports.clicks})`,
			ctr: sql<number>`CASE WHEN SUM(${reports.impressions}) > 0 THEN (SUM(${reports.clicks})::float / SUM(${reports.impressions})) * 100 ELSE 0 END`,
			totalRevenue: sql<number>`SUM(${reports.salesRevenue})`,
			productsCount: sql<number>`COUNT(DISTINCT ${reports.productId})`,
			campaignsCount: sql<number>`COUNT(DISTINCT ${reports.campaignId})`,
			avgCpc: sql<number>`CASE WHEN SUM(${reports.clicks}) > 0 THEN SUM(${reports.totalAdSpend}) / SUM(${reports.clicks}) ELSE 0 END`
		})
		.from(reports)
		.where(sql.join(conditions, sql` AND `))
		.groupBy(reports.productId, reports.productName, reports.currency);

	return { products, keywordFilter, campaignFilter };
};
