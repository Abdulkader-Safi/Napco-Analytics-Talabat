import {
	pgTable,
	serial,
	text,
	integer,
	timestamp,
	index,
	doublePrecision
} from 'drizzle-orm/pg-core';

// ============================================================
// NAPCO Unified Data Schema - Drizzle ORM (PostgreSQL)
// Single denormalized table for all advertising and sales data
// ============================================================

export const napcoData = pgTable(
	'napco_data',
	{
		// Primary Key
		id: serial('id').primaryKey(),

		// Source Identification
		dataSource: text('data_source').notNull(), // 'ad_platform' or 'sellout'
		sourceFile: text('source_file'),
		reportDate: timestamp('report_date'),

		// Geographic Information
		country: text('country'),
		city: text('city'),
		currency: text('currency'),

		// Account Information (Ad Platform)
		accountId: text('account_id'),
		accountName: text('account_name'),
		accountBillingName: text('account_billing_name'),
		accountType: text('account_type'),

		// Brand & Company
		brandOwner: text('brand_owner'),
		brand: text('brand'),
		company: text('company'), // 'Top 5 Companies' from sellout

		// Category Information
		categoryId: text('category_id'),
		categoryName: text('category_name'), // Category Name (L2)
		subcategory: text('subcategory'),

		// Chain/Store Information
		chainId: text('chain_id'),
		chainName: text('chain_name'),
		vendorId: text('vendor_id'),
		vendorName: text('vendor_name'),

		// Product Information
		productId: text('product_id'),
		productName: text('product_name'),
		sku: text('sku'),
		barcode: text('barcode'),

		// Search & Targeting
		keyword: text('keyword'),
		assetType: text('asset_type'),
		biddingType: text('bidding_type'),
		placement: text('placement'),

		// Campaign Information
		campaignId: text('campaign_id'),
		campaignName: text('campaign_name'),
		campaignDescription: text('campaign_description'),
		campaignStatus: text('campaign_status'),
		campaignType: text('campaign_type'),
		campaignBudget: doublePrecision('campaign_budget'),
		campaignStartDate: timestamp('campaign_start_date'),
		campaignEndDate: timestamp('campaign_end_date'),
		campaignCreatedBy: text('campaign_created_by'),

		// Wallet Information
		walletId: text('wallet_id'),
		walletName: text('wallet_name'),
		walletBookingOrderId: text('wallet_booking_order_id'),
		walletCreatedBalance: doublePrecision('wallet_created_balance'),
		walletRemainingBalance: doublePrecision('wallet_remaining_balance'),
		walletCreatedBy: text('wallet_created_by'),
		walletStartDate: timestamp('wallet_start_date'),
		walletEndDate: timestamp('wallet_end_date'),
		walletPaymentMode: text('wallet_payment_mode'),

		// Performance Metrics (Ad Platform)
		impressions: integer('impressions').default(0),
		clicks: integer('clicks').default(0),
		ctr: doublePrecision('ctr').default(0), // Click-through rate
		orders: integer('orders').default(0),
		cvr: doublePrecision('cvr').default(0), // Conversion rate
		unitsSold: integer('units_sold').default(0),
		averageAdPosition: doublePrecision('average_ad_position'),

		// Cost Metrics (Ad Platform)
		totalAdSpend: doublePrecision('total_ad_spend').default(0),
		cpc: doublePrecision('cpc').default(0), // Cost per click
		cpa: doublePrecision('cpa').default(0), // Cost per acquisition
		roas: doublePrecision('roas').default(0), // Return on ad spend

		// Revenue Metrics
		salesRevenue: doublePrecision('sales_revenue').default(0),
		averageSalePrice: doublePrecision('average_sale_price'),
		totalQuantity: integer('total_quantity'),

		// Metadata
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow()
	},
	(table) => [
		// Date-based queries
		index('idx_report_date').on(table.reportDate),

		// Source filtering
		index('idx_data_source').on(table.dataSource),

		// Geographic queries
		index('idx_country').on(table.country),
		index('idx_city').on(table.city),

		// Product & Brand queries
		index('idx_brand').on(table.brand),
		index('idx_product_name').on(table.productName),
		index('idx_barcode').on(table.barcode),

		// Category queries
		index('idx_category').on(table.categoryName),

		// Campaign queries
		index('idx_campaign_id').on(table.campaignId),
		index('idx_campaign_name').on(table.campaignName),
		index('idx_campaign_status').on(table.campaignStatus),

		// Keyword/Search queries
		index('idx_keyword').on(table.keyword),

		// Performance queries
		index('idx_impressions').on(table.impressions),
		index('idx_revenue').on(table.salesRevenue),

		// Composite indexes for common query patterns
		index('idx_date_source').on(table.reportDate, table.dataSource),
		index('idx_brand_date').on(table.brand, table.reportDate),
		index('idx_campaign_date').on(table.campaignId, table.reportDate)
	]
);

// ============================================================
// Type Exports
// ============================================================

export type NapcoData = typeof napcoData.$inferSelect;
export type NewNapcoData = typeof napcoData.$inferInsert;
