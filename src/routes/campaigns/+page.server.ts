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
			avgRoas: sql<number>`CASE WHEN SUM(${reports.totalAdSpend}) > 0 THEN (SUM(${reports.salesRevenue}) / SUM(${reports.totalAdSpend})) * 100 ELSE 0 END`,
			assetTypes: sql<string[]>`ARRAY_AGG(DISTINCT ${reports.assetType}) FILTER (WHERE ${reports.assetType} IS NOT NULL)`
		})
		.from(reports)
		.groupBy(reports.campaignId, reports.campaignName, reports.currency);

	// Top keyword per search campaign (by ROAS)
	const keywordRows = await db
		.select({
			campaignId: reports.campaignId,
			keyword: reports.keyword,
			roas: sql<number>`CASE WHEN SUM(${reports.totalAdSpend}) > 0 THEN (SUM(${reports.salesRevenue}) / SUM(${reports.totalAdSpend})) * 100 ELSE 0 END`
		})
		.from(reports)
		.where(
			sql`${reports.assetType} = 'AD_TYPE_SEARCH' AND ${reports.keyword} IS NOT NULL AND ${reports.keyword} != ''`
		)
		.groupBy(reports.campaignId, reports.keyword);

	const topKeywordByCampaign = new Map<string, (typeof keywordRows)[number]>();
	for (const row of keywordRows) {
		const key = row.campaignId ?? '';
		const existing = topKeywordByCampaign.get(key);
		if (!existing || row.roas > existing.roas) {
			topKeywordByCampaign.set(key, row);
		}
	}
	const topKeywordMap = new Map<string, string>();
	for (const [key, row] of topKeywordByCampaign) {
		topKeywordMap.set(key, row.keyword ?? '');
	}

	// Top category per listing campaign (by ROAS)
	const categoryRows = await db
		.select({
			campaignId: reports.campaignId,
			category: reports.category,
			roas: sql<number>`CASE WHEN SUM(${reports.totalAdSpend}) > 0 THEN (SUM(${reports.salesRevenue}) / SUM(${reports.totalAdSpend})) * 100 ELSE 0 END`
		})
		.from(reports)
		.where(
			sql`${reports.assetType} = 'AD_TYPE_LISTING' AND ${reports.category} IS NOT NULL AND ${reports.category} != ''`
		)
		.groupBy(reports.campaignId, reports.category);

	const topCategoryByCampaign = new Map<string, (typeof categoryRows)[number]>();
	for (const row of categoryRows) {
		const key = row.campaignId ?? '';
		const existing = topCategoryByCampaign.get(key);
		if (!existing || row.roas > existing.roas) {
			topCategoryByCampaign.set(key, row);
		}
	}
	const topCategoryMap = new Map<string, string>();
	for (const [key, row] of topCategoryByCampaign) {
		topCategoryMap.set(key, row.category ?? '');
	}

	const enrichedCampaigns = campaigns.map((c) => ({
		...c,
		topKeyword: topKeywordMap.get(c.campaignId ?? '') ?? null,
		topCategory: topCategoryMap.get(c.campaignId ?? '') ?? null
	}));

	return { campaigns: enrichedCampaigns };
};
