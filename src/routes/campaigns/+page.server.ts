import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { reports } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const campaigns = await db
		.select({
			campaignId: reports.campaignId,
			campaignName: reports.campaignName,
			currency: reports.currency,
			startDate: sql<string>`MIN(${reports.campaignStartDate})`,
			endDate: sql<string>`MAX(${reports.campaignEndDate})`,
			productsCount: sql<number>`COUNT(DISTINCT ${reports.productId})`,
			keywordsCount: sql<number>`COUNT(DISTINCT ${reports.keyword})`,
			categoriesCount: sql<number>`COUNT(DISTINCT ${reports.category})`,
			totalRevenue: sql<number>`SUM(${reports.salesRevenue})`,
			totalAdSpend: sql<number>`SUM(${reports.totalAdSpend})`,
			totalClicks: sql<number>`SUM(${reports.clicks})`,
			totalOrders: sql<number>`SUM(${reports.orders})`,
			// Calculate ROAS from totals: (Total Revenue / Total Ad Spend) * 100
			// Use NULLIF to avoid division by zero
			avgRoas: sql<number>`CASE WHEN SUM(${reports.totalAdSpend}) > 0 THEN (SUM(${reports.salesRevenue}) / SUM(${reports.totalAdSpend})) * 100 ELSE 0 END`,
			// Get distinct asset types for each campaign
			assetTypes: sql<string[]>`ARRAY_AGG(DISTINCT ${reports.assetType}) FILTER (WHERE ${reports.assetType} IS NOT NULL)`
		})
		.from(reports)
		.groupBy(reports.campaignId, reports.campaignName, reports.currency);

	return { campaigns };
};
