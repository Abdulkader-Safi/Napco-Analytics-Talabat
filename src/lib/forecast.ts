import modelData from '../../static/forecast-model-v2.json';

// --- Types ---

export interface ForecastInput {
	campaignType: 'listing' | 'search';
	productNames: string[];
	category?: string;
	keywords?: string[];
	budget: number;
	startDate: string; // YYYY-MM-DD
	endDate: string; // YYYY-MM-DD
}

export interface ProductForecast {
	productName: string;
	confidence: 'high' | 'medium' | 'low';
	budget: number;
	estimatedSpend: number;
	estimatedRevenue: number;
	estimatedOrders: number;
	estimatedUnits: number;
	estimatedClicks: number;
	roas: number;
	organicRevenue: number;
	dailyBreakdown: DailyBreakdown[];
}

export interface DailyBreakdown {
	date: string;
	spend: number;
	revenue: number;
	orders: number;
	seasonalityFactor: number;
}

export interface ForecastResult {
	totalRevenue: number;
	totalOrders: number;
	totalUnits: number;
	totalSpend: number;
	totalClicks: number;
	roas: number;
	organicRevenue: number;
	products: ProductForecast[];
	aggregatedDaily: DailyBreakdown[];
}

interface ModelProduct {
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
}

interface Model {
	spendUtilizationRate: number;
	seasonality: Record<string, number>;
	dayOfWeekIndex: Record<string, number>;
	globalAvg: {
		roas: number;
		ordersPerKwd: number;
		unitsPerKwd: number;
		listing: { roas: number; ordersPerKwd: number; unitsPerKwd: number };
		search: { roas: number; ordersPerKwd: number; unitsPerKwd: number };
	};
	categories: Record<
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
	>;
	keywords: Record<
		string,
		{
			roas: number;
			ordersPerKwd: number;
			ctr: number;
			cvr: number;
			totalSpend: number;
		}
	>;
	products: Record<string, ModelProduct>;
	builtAt: string;
}

const model = modelData as unknown as Model;

// --- Helpers ---

function getDaysBetween(start: string, end: string): string[] {
	const days: string[] = [];
	const d = new Date(start);
	const last = new Date(end);
	while (d <= last) {
		days.push(d.toISOString().slice(0, 10));
		d.setDate(d.getDate() + 1);
	}
	return days;
}

function getSeasonality(month: number): number {
	return model.seasonality[String(month)] ?? 1.0;
}

function getDowFactor(date: Date): number {
	// JS: 0=Sun,1=Mon...6=Sat → model: 0=Mon...6=Sun
	const jsDay = date.getDay();
	const modelDay = jsDay === 0 ? 6 : jsDay - 1;
	return model.dayOfWeekIndex[String(modelDay)] ?? 1.0;
}

function diminishingReturns(dailySpend: number, baselineDaily: number): number {
	if (baselineDaily <= 0) return 1.0;
	const ratio = dailySpend / baselineDaily;
	if (ratio <= 1) return 1.0;
	// Logarithmic diminishing returns beyond historical daily spend
	return 1.0 / Math.pow(ratio, 0.15);
}

function getConfidence(
	product: ModelProduct,
	campaignType: 'listing' | 'search'
): 'high' | 'medium' | 'low' {
	const typeData = campaignType === 'listing' ? product.listing : product.search;
	const days = typeData?.activeDays ?? product.activeDays;
	const spend = typeData?.totalSpend ?? product.totalSpend;

	if (days >= 50 && spend >= 30) return 'high';
	if (days >= 20 && spend >= 10) return 'medium';
	return 'low';
}

// --- Main forecast ---

export function forecast(input: ForecastInput): ForecastResult {
	const { campaignType, productNames, category, keywords, budget, startDate, endDate } = input;
	const days = getDaysBetween(startDate, endDate);
	const numDays = days.length;
	if (numDays === 0 || productNames.length === 0 || budget <= 0) {
		return {
			totalRevenue: 0,
			totalOrders: 0,
			totalUnits: 0,
			totalSpend: 0,
			totalClicks: 0,
			roas: 0,
			organicRevenue: 0,
			products: [],
			aggregatedDaily: []
		};
	}

	const budgetPerProduct = budget / productNames.length;
	const globalTypeAvg =
		campaignType === 'listing' ? model.globalAvg.listing : model.globalAvg.search;

	const productForecasts: ProductForecast[] = [];
	const dailyAggMap = new Map<string, DailyBreakdown>();

	for (const productName of productNames) {
		const product = model.products[productName];

		// Resolve coefficients with fallback chain
		let roas: number;
		let ordersPerDay: number;
		let unitsPerDay: number;

		if (product) {
			const typeData = campaignType === 'listing' ? product.listing : product.search;
			if (typeData && typeData.totalSpend >= 5) {
				roas = typeData.roas;
				ordersPerDay = typeData.ordersPerKwd;
				unitsPerDay = typeData.unitsPerKwd;
			} else if (product.totalSpend >= 5) {
				roas = product.roas;
				ordersPerDay = product.ordersPerKwd;
				unitsPerDay = product.unitsPerKwd;
			} else {
				roas = globalTypeAvg.roas;
				ordersPerDay = globalTypeAvg.ordersPerKwd;
				unitsPerDay = globalTypeAvg.unitsPerKwd;
			}
		} else {
			roas = globalTypeAvg.roas;
			ordersPerDay = globalTypeAvg.ordersPerKwd;
			unitsPerDay = globalTypeAvg.unitsPerKwd;
		}

		// Category modifier for listing with limited product data
		if (
			campaignType === 'listing' &&
			category &&
			model.categories[category] &&
			(!product || !product.listing || product.listing.totalSpend < 10)
		) {
			const catRoas = model.categories[category].roas;
			const globalListingRoas = model.globalAvg.listing.roas;
			if (globalListingRoas > 0) {
				roas = roas * (catRoas / globalListingRoas);
			}
		}

		// Keyword modifier for search
		if (campaignType === 'search' && keywords && keywords.length > 0) {
			const kwRoasValues = keywords
				.map((kw) => model.keywords[kw]?.roas)
				.filter((r): r is number => r !== undefined && r > 0);
			if (kwRoasValues.length > 0) {
				const avgKwRoas = kwRoasValues.reduce((a, b) => a + b, 0) / kwRoasValues.length;
				const globalSearchRoas = model.globalAvg.search.roas;
				if (globalSearchRoas > 0) {
					roas = roas * (avgKwRoas / globalSearchRoas);
				}
			}
		}

		const dailyBudget = budgetPerProduct / numDays;
		const historicalDailySpend = product ? product.totalSpend / Math.max(product.activeDays, 1) : 0;
		const confidence = product ? getConfidence(product, campaignType) : 'low';
		const organicDailyRevenue = product?.organicDailyRevenue ?? 0;

		let totalRevenue = 0;
		let totalOrders = 0;
		let totalUnits = 0;
		let totalSpend = 0;
		let totalClicks = 0;
		let totalOrganic = 0;
		const dailyBreakdown: DailyBreakdown[] = [];

		for (const day of days) {
			const d = new Date(day);
			const month = d.getMonth() + 1;
			const seasonFactor = getSeasonality(month);
			const dowFactor = getDowFactor(d);
			const combinedFactor = seasonFactor * dowFactor;

			const dailySpend = dailyBudget * model.spendUtilizationRate * combinedFactor;
			const dr = diminishingReturns(dailySpend, historicalDailySpend);

			const dayRevenue = dailySpend * roas * dr * combinedFactor;
			const dayOrders = ordersPerDay * combinedFactor * dr;
			const dayUnits = unitsPerDay * combinedFactor * dr;
			const dayClicks = product && product.ctr > 0 ? dailySpend / 0.2 : dailySpend / 0.2; // CPC ~0.2

			const dayOrganic = organicDailyRevenue * seasonFactor;

			totalRevenue += dayRevenue;
			totalOrders += dayOrders;
			totalUnits += dayUnits;
			totalSpend += dailySpend;
			totalClicks += dayClicks;
			totalOrganic += dayOrganic;

			const breakdown: DailyBreakdown = {
				date: day,
				spend: Math.round(dailySpend * 100) / 100,
				revenue: Math.round(dayRevenue * 100) / 100,
				orders: Math.round(dayOrders * 100) / 100,
				seasonalityFactor: Math.round(combinedFactor * 10000) / 10000
			};
			dailyBreakdown.push(breakdown);

			// Aggregate daily
			const existing = dailyAggMap.get(day);
			if (existing) {
				existing.spend += breakdown.spend;
				existing.revenue += breakdown.revenue;
				existing.orders += breakdown.orders;
			} else {
				dailyAggMap.set(day, { ...breakdown });
			}
		}

		productForecasts.push({
			productName,
			confidence,
			budget: budgetPerProduct,
			estimatedSpend: Math.round(totalSpend * 100) / 100,
			estimatedRevenue: Math.round(totalRevenue * 100) / 100,
			estimatedOrders: Math.round(totalOrders),
			estimatedUnits: Math.round(totalUnits),
			estimatedClicks: Math.round(totalClicks),
			roas: totalSpend > 0 ? Math.round((totalRevenue / totalSpend) * 100) / 100 : 0,
			organicRevenue: Math.round(totalOrganic * 100) / 100,
			dailyBreakdown
		});
	}

	const totals = productForecasts.reduce(
		(acc, p) => ({
			revenue: acc.revenue + p.estimatedRevenue,
			orders: acc.orders + p.estimatedOrders,
			units: acc.units + p.estimatedUnits,
			spend: acc.spend + p.estimatedSpend,
			clicks: acc.clicks + p.estimatedClicks,
			organic: acc.organic + p.organicRevenue
		}),
		{ revenue: 0, orders: 0, units: 0, spend: 0, clicks: 0, organic: 0 }
	);

	const aggregatedDaily = Array.from(dailyAggMap.values()).map((d) => ({
		...d,
		spend: Math.round(d.spend * 100) / 100,
		revenue: Math.round(d.revenue * 100) / 100,
		orders: Math.round(d.orders * 100) / 100
	}));

	return {
		totalRevenue: Math.round(totals.revenue * 100) / 100,
		totalOrders: Math.round(totals.orders),
		totalUnits: Math.round(totals.units),
		totalSpend: Math.round(totals.spend * 100) / 100,
		totalClicks: Math.round(totals.clicks),
		roas: totals.spend > 0 ? Math.round((totals.revenue / totals.spend) * 100) / 100 : 0,
		organicRevenue: Math.round(totals.organic * 100) / 100,
		products: productForecasts,
		aggregatedDaily
	};
}

// --- Data accessors ---

export interface AvailableProduct {
	name: string;
	hasListing: boolean;
	hasSearch: boolean;
	confidence: 'high' | 'medium' | 'low';
	totalSpend: number;
	activeDays: number;
	categories: string[];
	keywords: string[];
}

export function getAvailableProducts(): AvailableProduct[] {
	return Object.entries(model.products)
		.map(([name, p]) => ({
			name,
			hasListing: !!p.listing,
			hasSearch: !!p.search,
			confidence:
				p.activeDays >= 50 && p.totalSpend >= 30
					? ('high' as const)
					: p.activeDays >= 20 && p.totalSpend >= 10
						? ('medium' as const)
						: ('low' as const),
			totalSpend: p.totalSpend,
			activeDays: p.activeDays,
			categories: p.categories ?? [],
			keywords: p.keywords ?? []
		}))
		.sort((a, b) => b.totalSpend - a.totalSpend);
}

export interface CategoryInfo {
	name: string;
	roas: number;
	totalSpend: number;
}

export function getCategories(): CategoryInfo[] {
	return Object.entries(model.categories)
		.map(([name, c]) => ({
			name,
			roas: c.roas,
			totalSpend: c.totalSpend
		}))
		.sort((a, b) => b.totalSpend - a.totalSpend);
}

export interface KeywordInfo {
	name: string;
	roas: number;
	totalSpend: number;
}

export function getKeywords(): KeywordInfo[] {
	return Object.entries(model.keywords)
		.map(([name, k]) => ({
			name,
			roas: k.roas,
			totalSpend: k.totalSpend
		}))
		.sort((a, b) => b.totalSpend - a.totalSpend);
}

export function getModelMetadata() {
	return {
		spendUtilizationRate: model.spendUtilizationRate,
		productCount: Object.keys(model.products).length,
		categoryCount: Object.keys(model.categories).length,
		keywordCount: Object.keys(model.keywords).length,
		builtAt: model.builtAt
	};
}
