import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, boolean, index, doublePrecision, integer } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
	role: text('role'),
	banned: boolean('banned').default(false),
	banReason: text('ban_reason'),
	banExpires: timestamp('ban_expires')
});

export const session = pgTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: timestamp('expires_at').notNull(),
		token: text('token').notNull().unique(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		impersonatedBy: text('impersonated_by')
	},
	(table) => [index('session_userId_idx').on(table.userId)]
);

export const account = pgTable(
	'account',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at'),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
		scope: text('scope'),
		password: text('password'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull()
	},
	(table) => [index('account_userId_idx').on(table.userId)]
);

export const verification = pgTable(
	'verification',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: timestamp('expires_at').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull()
	},
	(table) => [index('verification_identifier_idx').on(table.identifier)]
);

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account)
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	})
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	})
}));

export const napcoData = pgTable(
	'napco_data',
	{
		// Primary Key
		id: text('id').primaryKey(),

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
		// Main category from Sellout: Household Care, Feminine Care, Baby Care
		category: text('category'),
		// Subcategory from Report (Category Name L2): Facial Tissues, Large Bags, 1-2 Years, etc.
		subcategory: text('subcategory'),
		// Original category ID from Report files
		categoryId: text('category_id'),

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
		ctr: doublePrecision('ctr').default(0),
		orders: integer('orders').default(0),
		cvr: doublePrecision('cvr').default(0),
		unitsSold: integer('units_sold').default(0),
		averageAdPosition: doublePrecision('average_ad_position'),

		// Cost Metrics (Ad Platform)
		totalAdSpend: doublePrecision('total_ad_spend').default(0),
		cpc: doublePrecision('cpc').default(0),
		cpa: doublePrecision('cpa').default(0),
		roas: doublePrecision('roas').default(0),

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
		index('idx_sku').on(table.sku),

		// Category queries
		index('idx_category').on(table.category),
		index('idx_subcategory').on(table.subcategory),
		index('idx_category_subcategory').on(table.category, table.subcategory),

		// Campaign queries
		index('idx_campaign_id').on(table.campaignId),
		index('idx_campaign_name').on(table.campaignName),
		index('idx_campaign_status').on(table.campaignStatus),

		// Keyword/Search queries
		index('idx_keyword').on(table.keyword),

		// Performance queries
		index('idx_impressions').on(table.impressions),
		index('idx_revenue').on(table.salesRevenue),

		// Composite indexes
		index('idx_date_source').on(table.reportDate, table.dataSource),
		index('idx_brand_date').on(table.brand, table.reportDate),
		index('idx_campaign_date').on(table.campaignId, table.reportDate),
		index('idx_category_date').on(table.category, table.reportDate)
	]
);

// ============================================================
// Type Exports
// ============================================================

export type NapcoData = typeof napcoData.$inferSelect;
export type NewNapcoData = typeof napcoData.$inferInsert;

// ============================================================
// Category Reference (for documentation)
// ============================================================
//
// Main Categories (from Sellout files):
//   - Household Care
//   - Feminine Care
//   - Baby Care
//
// Subcategories (from Report files - Category Name L2):
//   Baby Care:
//     - 6 - 12 Months
//     - 1 - 2 Years
//     - 2 - 3 Years
//     - 3+ Years
//     - Size 6+
//     - Baby Wipes
//     - Cotton Buds & Pads
//
//   Household Care:
//     - Facial Tissues
//     - Kitchen Rolls
//     - Toilet Paper
//     - Large Bags
//     - Medium Bags
//     - Small Bags
//     - Aluminum Foil
//     - Baking Paper
//     - Cling Film
//     - Food Storage Bags
//     - Cups & Straws
//     - Table Covers
//
//   Feminine Care:
//     - Feminine Pads
//     - Panty Liners
// ============================================================
