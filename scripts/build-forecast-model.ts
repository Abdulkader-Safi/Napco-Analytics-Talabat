import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/server/db/schema';
import { sql } from 'drizzle-orm';
import { writeFileSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client, { schema });
const { reports, sellout } = schema;

async function build() {
	console.log('Building forecast model v2...');

	// 1. Per-product overall metrics
	console.log('  Querying per-product overall metrics...');
	const productOverall = await db
		.select({
			productName: reports.productName,
			totalSpend: sql<number>`COALESCE(SUM(${reports.totalAdSpend}), 0)`,
			totalRevenue: sql<number>`COALESCE(SUM(${reports.salesRevenue}), 0)`,
			totalClicks: sql<number>`COALESCE(SUM(${reports.clicks}), 0)`,
			totalOrders: sql<number>`COALESCE(SUM(${reports.orders}), 0)`,
			totalUnits: sql<number>`COALESCE(SUM(${reports.unitsSold}), 0)`,
			activeDays: sql<number>`COUNT(DISTINCT ${reports.reportDate})`
		})
		.from(reports)
		.where(sql`${reports.productName} IS NOT NULL AND ${reports.productName} != ''`)
		.groupBy(reports.productName);

	// 2. Per-product per-type metrics
	console.log('  Querying per-product per-type metrics...');
	const productByType = await db
		.select({
			productName: reports.productName,
			assetType: reports.assetType,
			totalSpend: sql<number>`COALESCE(SUM(${reports.totalAdSpend}), 0)`,
			totalRevenue: sql<number>`COALESCE(SUM(${reports.salesRevenue}), 0)`,
			totalClicks: sql<number>`COALESCE(SUM(${reports.clicks}), 0)`,
			totalOrders: sql<number>`COALESCE(SUM(${reports.orders}), 0)`,
			totalUnits: sql<number>`COALESCE(SUM(${reports.unitsSold}), 0)`,
			activeDays: sql<number>`COUNT(DISTINCT ${reports.reportDate})`
		})
		.from(reports)
		.where(
			sql`${reports.productName} IS NOT NULL AND ${reports.productName} != '' AND ${reports.assetType} IS NOT NULL`
		)
		.groupBy(reports.productName, reports.assetType);

	// 3. Categories (listing only)
	console.log('  Querying category metrics...');
	const categoryRows = await db
		.select({
			category: reports.category,
			totalSpend: sql<number>`COALESCE(SUM(${reports.totalAdSpend}), 0)`,
			totalRevenue: sql<number>`COALESCE(SUM(${reports.salesRevenue}), 0)`,
			totalClicks: sql<number>`COALESCE(SUM(${reports.clicks}), 0)`,
			totalOrders: sql<number>`COALESCE(SUM(${reports.orders}), 0)`,
			totalUnits: sql<number>`COALESCE(SUM(${reports.unitsSold}), 0)`,
			totalImpressions: sql<number>`COALESCE(SUM(${reports.impressions}), 0)`,
			kwdCount: sql<number>`COUNT(DISTINCT ${reports.keyword})`
		})
		.from(reports)
		.where(
			sql`${reports.assetType} = 'AD_TYPE_LISTING' AND ${reports.category} IS NOT NULL AND ${reports.category} != ''`
		)
		.groupBy(reports.category);

	// 4. Keywords (search only, >= 1 KWD spend)
	console.log('  Querying keyword metrics...');
	const keywordRows = await db
		.select({
			keyword: reports.keyword,
			totalSpend: sql<number>`COALESCE(SUM(${reports.totalAdSpend}), 0)`,
			totalRevenue: sql<number>`COALESCE(SUM(${reports.salesRevenue}), 0)`,
			totalClicks: sql<number>`COALESCE(SUM(${reports.clicks}), 0)`,
			totalOrders: sql<number>`COALESCE(SUM(${reports.orders}), 0)`,
			totalUnits: sql<number>`COALESCE(SUM(${reports.unitsSold}), 0)`,
			totalImpressions: sql<number>`COALESCE(SUM(${reports.impressions}), 0)`
		})
		.from(reports)
		.where(
			sql`${reports.assetType} = 'AD_TYPE_SEARCH' AND ${reports.keyword} IS NOT NULL AND ${reports.keyword} != ''`
		)
		.groupBy(reports.keyword)
		.having(sql`SUM(${reports.totalAdSpend}) >= 1`);

	// 5. Seasonality (month)
	console.log('  Querying seasonality...');
	const monthlyRows = await db
		.select({
			month: sql<number>`EXTRACT(MONTH FROM ${reports.reportDate}::date)`,
			totalSpend: sql<number>`COALESCE(SUM(${reports.totalAdSpend}), 0)`,
			totalRevenue: sql<number>`COALESCE(SUM(${reports.salesRevenue}), 0)`
		})
		.from(reports)
		.where(sql`${reports.reportDate} IS NOT NULL AND ${reports.totalAdSpend} > 0`)
		.groupBy(sql`EXTRACT(MONTH FROM ${reports.reportDate}::date)`);

	// 6. Day-of-week
	console.log('  Querying day-of-week...');
	const dowRows = await db
		.select({
			dow: sql<number>`EXTRACT(DOW FROM ${reports.reportDate}::date)`,
			totalSpend: sql<number>`COALESCE(SUM(${reports.totalAdSpend}), 0)`,
			totalRevenue: sql<number>`COALESCE(SUM(${reports.salesRevenue}), 0)`
		})
		.from(reports)
		.where(sql`${reports.reportDate} IS NOT NULL AND ${reports.totalAdSpend} > 0`)
		.groupBy(sql`EXTRACT(DOW FROM ${reports.reportDate}::date)`);

	// 7. Organic baseline from sellout
	console.log('  Querying organic baseline...');
	const organicRows = await db
		.select({
			sku: sellout.sku,
			totalQuantity: sql<number>`COALESCE(SUM(${sellout.totalQuantity}), 0)`,
			totalRevenue: sql<number>`COALESCE(SUM(${sellout.totalRevenue}), 0)`,
			activeDays: sql<number>`COUNT(DISTINCT ${sellout.reportDate})`
		})
		.from(sellout)
		.where(sql`${sellout.sku} IS NOT NULL AND ${sellout.sku} != ''`)
		.groupBy(sellout.sku);

	// 8. Global averages
	console.log('  Querying global averages...');
	const globalAll = await db
		.select({
			totalSpend: sql<number>`COALESCE(SUM(${reports.totalAdSpend}), 0)`,
			totalRevenue: sql<number>`COALESCE(SUM(${reports.salesRevenue}), 0)`,
			totalOrders: sql<number>`COALESCE(SUM(${reports.orders}), 0)`,
			totalUnits: sql<number>`COALESCE(SUM(${reports.unitsSold}), 0)`,
			kwdCount: sql<number>`COUNT(DISTINCT ${reports.keyword})`
		})
		.from(reports)
		.where(sql`${reports.totalAdSpend} > 0`);

	const globalListing = await db
		.select({
			totalSpend: sql<number>`COALESCE(SUM(${reports.totalAdSpend}), 0)`,
			totalRevenue: sql<number>`COALESCE(SUM(${reports.salesRevenue}), 0)`,
			totalOrders: sql<number>`COALESCE(SUM(${reports.orders}), 0)`,
			totalUnits: sql<number>`COALESCE(SUM(${reports.unitsSold}), 0)`,
			kwdCount: sql<number>`COUNT(DISTINCT ${reports.keyword})`
		})
		.from(reports)
		.where(sql`${reports.assetType} = 'AD_TYPE_LISTING' AND ${reports.totalAdSpend} > 0`);

	const globalSearch = await db
		.select({
			totalSpend: sql<number>`COALESCE(SUM(${reports.totalAdSpend}), 0)`,
			totalRevenue: sql<number>`COALESCE(SUM(${reports.salesRevenue}), 0)`,
			totalOrders: sql<number>`COALESCE(SUM(${reports.orders}), 0)`,
			totalUnits: sql<number>`COALESCE(SUM(${reports.unitsSold}), 0)`,
			kwdCount: sql<number>`COUNT(DISTINCT ${reports.keyword})`
		})
		.from(reports)
		.where(sql`${reports.assetType} = 'AD_TYPE_SEARCH' AND ${reports.totalAdSpend} > 0`);

	// 9. Product → category associations (from listing reports)
	console.log('  Querying product-category associations...');
	const productCategoryRows = await db
		.select({
			productName: reports.productName,
			category: reports.category
		})
		.from(reports)
		.where(
			sql`${reports.productName} IS NOT NULL AND ${reports.productName} != '' AND ${reports.category} IS NOT NULL AND ${reports.category} != ''`
		)
		.groupBy(reports.productName, reports.category);

	const productCategoriesMap = new Map<string, string[]>();
	for (const row of productCategoryRows) {
		const name = row.productName ?? '';
		const cat = row.category ?? '';
		if (!name || !cat) continue;
		const existing = productCategoriesMap.get(name) ?? [];
		if (!existing.includes(cat)) existing.push(cat);
		productCategoriesMap.set(name, existing);
	}

	// 10. Product → keyword associations (from search reports)
	console.log('  Querying product-keyword associations...');
	const productKeywordRows = await db
		.select({
			productName: reports.productName,
			keyword: reports.keyword
		})
		.from(reports)
		.where(
			sql`${reports.productName} IS NOT NULL AND ${reports.productName} != '' AND ${reports.keyword} IS NOT NULL AND ${reports.keyword} != '' AND ${reports.assetType} = 'AD_TYPE_SEARCH'`
		)
		.groupBy(reports.productName, reports.keyword);

	const productKeywordsMap = new Map<string, string[]>();
	for (const row of productKeywordRows) {
		const name = row.productName ?? '';
		const kw = row.keyword ?? '';
		if (!name || !kw) continue;
		const existing = productKeywordsMap.get(name) ?? [];
		if (!existing.includes(kw)) existing.push(kw);
		productKeywordsMap.set(name, existing);
	}

	// --- Build the model ---
	console.log('  Building model JSON...');

	function safeDiv(a: number, b: number, fallback = 0): number {
		return b > 0 ? a / b : fallback;
	}

	function round(n: number, decimals = 4): number {
		return Math.round(n * 10 ** decimals) / 10 ** decimals;
	}

	// Build products map
	type ProductData = {
		totalSpend: number;
		totalRevenue: number;
		totalClicks: number;
		totalOrders: number;
		totalUnits: number;
		activeDays: number;
		roas: number;
		ordersPerKwd: number;
		unitsPerKwd: number;
		aov: number;
		ctr: number;
		cvr: number;
		listing?: {
			totalSpend: number;
			totalRevenue: number;
			activeDays: number;
			roas: number;
			ordersPerKwd: number;
			unitsPerKwd: number;
		};
		search?: {
			totalSpend: number;
			totalRevenue: number;
			activeDays: number;
			roas: number;
			ordersPerKwd: number;
			unitsPerKwd: number;
		};
		organicDailyUnits: number;
		organicDailyRevenue: number;
		categories: string[];
		keywords: string[];
	};

	const products: Record<string, ProductData> = {};
	for (const row of productOverall) {
		const name = row.productName ?? '';
		if (!name) continue;
		products[name] = {
			totalSpend: round(row.totalSpend),
			totalRevenue: round(row.totalRevenue),
			totalClicks: row.totalClicks,
			totalOrders: row.totalOrders,
			totalUnits: row.totalUnits,
			activeDays: row.activeDays,
			roas: round(safeDiv(row.totalRevenue, row.totalSpend)),
			ordersPerKwd: round(safeDiv(row.totalOrders, row.activeDays)),
			unitsPerKwd: round(safeDiv(row.totalUnits, row.activeDays)),
			aov: round(safeDiv(row.totalRevenue, row.totalOrders)),
			ctr: 0,
			cvr: 0,
			organicDailyUnits: 0,
			organicDailyRevenue: 0,
			categories: productCategoriesMap.get(name) ?? [],
			keywords: productKeywordsMap.get(name) ?? []
		};
	}

	// Merge per-type data
	for (const row of productByType) {
		const name = row.productName ?? '';
		if (!name || !products[name]) continue;

		const typeData = {
			totalSpend: round(row.totalSpend),
			totalRevenue: round(row.totalRevenue),
			activeDays: row.activeDays,
			roas: round(safeDiv(row.totalRevenue, row.totalSpend)),
			ordersPerKwd: round(safeDiv(row.totalOrders, row.activeDays)),
			unitsPerKwd: round(safeDiv(row.totalUnits, row.activeDays))
		};

		if (row.assetType === 'AD_TYPE_LISTING') {
			products[name].listing = typeData;
		} else if (row.assetType === 'AD_TYPE_SEARCH') {
			products[name].search = typeData;
		}
	}

	// Match organic baseline by substring matching
	const organicMap = organicRows.map((r) => ({
		sku: r.sku ?? '',
		dailyUnits: round(safeDiv(r.totalQuantity, r.activeDays)),
		dailyRevenue: round(safeDiv(r.totalRevenue, r.activeDays))
	}));

	for (const [productName, product] of Object.entries(products)) {
		const nameLower = productName.toLowerCase();
		const match = organicMap.find(
			(o) =>
				o.sku &&
				(nameLower.includes(o.sku.toLowerCase()) || o.sku.toLowerCase().includes(nameLower))
		);
		if (match) {
			product.organicDailyUnits = match.dailyUnits;
			product.organicDailyRevenue = match.dailyRevenue;
		}
	}

	// Build categories
	const categories: Record<
		string,
		{
			roas: number;
			ordersPerKwd: number;
			unitsPerKwd: number;
			ctr: number;
			cvr: number;
			totalSpend: number;
			productCount: number;
		}
	> = {};
	for (const row of categoryRows) {
		const cat = row.category ?? '';
		if (!cat) continue;
		categories[cat] = {
			roas: round(safeDiv(row.totalRevenue, row.totalSpend)),
			ordersPerKwd: round(safeDiv(row.totalOrders, row.kwdCount || 1)),
			unitsPerKwd: round(safeDiv(row.totalUnits, row.kwdCount || 1)),
			ctr: round(safeDiv(row.totalClicks, row.totalImpressions)),
			cvr: round(safeDiv(row.totalOrders, row.totalClicks)),
			totalSpend: round(row.totalSpend),
			productCount: row.kwdCount
		};
	}

	// Build keywords
	const keywords: Record<
		string,
		{
			roas: number;
			ordersPerKwd: number;
			ctr: number;
			cvr: number;
			totalSpend: number;
		}
	> = {};
	for (const row of keywordRows) {
		const kw = row.keyword ?? '';
		if (!kw) continue;
		keywords[kw] = {
			roas: round(safeDiv(row.totalRevenue, row.totalSpend)),
			ordersPerKwd: round(safeDiv(row.totalOrders, 1)),
			ctr: round(safeDiv(row.totalClicks, row.totalImpressions)),
			cvr: round(safeDiv(row.totalOrders, row.totalClicks)),
			totalSpend: round(row.totalSpend)
		};
	}

	// Build seasonality
	const totalMonthlySpend = monthlyRows.reduce((s, r) => s + r.totalSpend, 0);
	const totalMonthlyRevenue = monthlyRows.reduce((s, r) => s + r.totalRevenue, 0);
	const overallMonthlyRoas = safeDiv(totalMonthlyRevenue, totalMonthlySpend, 1);

	const seasonality: Record<string, number> = {};
	for (let m = 1; m <= 12; m++) {
		const row = monthlyRows.find((r) => Number(r.month) === m);
		if (row && row.totalSpend > 0) {
			const monthRoas = safeDiv(row.totalRevenue, row.totalSpend, 1);
			seasonality[String(m)] = round(safeDiv(monthRoas, overallMonthlyRoas, 1));
		} else {
			seasonality[String(m)] = 1.0;
		}
	}

	// Build day-of-week (PG: 0=Sun → model: 0=Mon)
	const totalDowSpend = dowRows.reduce((s, r) => s + r.totalSpend, 0);
	const totalDowRevenue = dowRows.reduce((s, r) => s + r.totalRevenue, 0);
	const overallDowRoas = safeDiv(totalDowRevenue, totalDowSpend, 1);

	const dayOfWeekIndex: Record<string, number> = {};
	for (let modelDay = 0; modelDay < 7; modelDay++) {
		// model 0=Mon → PG dow: Mon=1, Tue=2, ... Sat=6, Sun=0
		const pgDow = (modelDay + 1) % 7;
		const row = dowRows.find((r) => Number(r.dow) === pgDow);
		if (row && row.totalSpend > 0) {
			const dayRoas = safeDiv(row.totalRevenue, row.totalSpend, 1);
			dayOfWeekIndex[String(modelDay)] = round(safeDiv(dayRoas, overallDowRoas, 1));
		} else {
			dayOfWeekIndex[String(modelDay)] = 1.0;
		}
	}

	// Build global averages
	const ga = globalAll[0];
	const gl = globalListing[0];
	const gs = globalSearch[0];

	const globalAvg = {
		roas: round(safeDiv(ga.totalRevenue, ga.totalSpend)),
		ordersPerKwd: round(safeDiv(ga.totalOrders, ga.kwdCount || 1)),
		unitsPerKwd: round(safeDiv(ga.totalUnits, ga.kwdCount || 1)),
		listing: {
			roas: round(safeDiv(gl.totalRevenue, gl.totalSpend)),
			ordersPerKwd: round(safeDiv(gl.totalOrders, gl.kwdCount || 1)),
			unitsPerKwd: round(safeDiv(gl.totalUnits, gl.kwdCount || 1))
		},
		search: {
			roas: round(safeDiv(gs.totalRevenue, gs.totalSpend)),
			ordersPerKwd: round(safeDiv(gs.totalOrders, gs.kwdCount || 1)),
			unitsPerKwd: round(safeDiv(gs.totalUnits, gs.kwdCount || 1))
		}
	};

	const model = {
		spendUtilizationRate: 0.5941,
		seasonality,
		dayOfWeekIndex,
		globalAvg,
		categories,
		keywords,
		products,
		builtAt: new Date().toISOString()
	};

	const outputPath = 'static/forecast-model-v2.json';
	writeFileSync(outputPath, JSON.stringify(model, null, 2));
	console.log(
		`Model built: ${Object.keys(products).length} products, ${Object.keys(categories).length} categories, ${Object.keys(keywords).length} keywords`
	);
	console.log(`Written to ${outputPath}`);

	await client.end();
}

build().catch((err) => {
	console.error('Build failed:', err);
	client.end().then(() => process.exit(1));
});
