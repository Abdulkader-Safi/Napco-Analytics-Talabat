import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { reports } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const campaignFilter = url.searchParams.get('campaign') || null;

	const conditions = [sql`${reports.keyword} IS NOT NULL AND ${reports.keyword} != ''`];
	if (campaignFilter) conditions.push(sql`${reports.campaignId} = ${campaignFilter}`);

	const keywords = await db
		.select({
			keyword: reports.keyword,
			currency: reports.currency,
			impressions: sql<number>`SUM(${reports.impressions})`,
			totalClicks: sql<number>`SUM(${reports.clicks})`,
			// CTR = (Total Clicks / Total Impressions) * 100
			ctr: sql<number>`CASE WHEN SUM(${reports.impressions}) > 0 THEN (SUM(${reports.clicks})::float / SUM(${reports.impressions})) * 100 ELSE 0 END`,
			totalRevenue: sql<number>`SUM(${reports.salesRevenue})`,
			productsCount: sql<number>`COUNT(DISTINCT ${reports.productId})`,
			campaignsCount: sql<number>`COUNT(DISTINCT ${reports.campaignId})`,
			// Average CPC = Total Ad Spend / Total Clicks
			avgCpc: sql<number>`CASE WHEN SUM(${reports.clicks}) > 0 THEN SUM(${reports.totalAdSpend}) / SUM(${reports.clicks}) ELSE 0 END`,
			// ROAS = (Total Revenue / Total Ad Spend) * 100
			avgRoas: sql<number>`CASE WHEN SUM(${reports.totalAdSpend}) > 0 THEN (SUM(${reports.salesRevenue}) / SUM(${reports.totalAdSpend})) * 100 ELSE 0 END`
		})
		.from(reports)
		.where(sql.join(conditions, sql` AND `))
		.groupBy(reports.keyword, reports.currency);

	return { keywords, campaignFilter };
};
