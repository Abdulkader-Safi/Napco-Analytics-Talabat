import { relations } from 'drizzle-orm';
import {
	pgTable,
	text,
	timestamp,
	boolean,
	index,
	doublePrecision,
	integer,
	date
} from 'drizzle-orm/pg-core';

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

export const reports = pgTable(
	'reports',
	{
		id: text('id').primaryKey(),

		// Source & Date
		sourceFile: text('source_file'),
		reportDate: date('report_date'),

		// Geographic
		country: text('country'),
		currency: text('currency'),

		// Account
		accountId: text('account_id'),
		accountName: text('account_name'),
		accountBillingName: text('account_billing_name'),
		accountType: text('account_type'),

		// Brand
		brandOwner: text('brand_owner'),
		brand: text('brand'),

		// Category
		category: text('category'),
		subcategory: text('subcategory'),
		categoryId: text('category_id'),

		// Chain/Store
		chainId: text('chain_id'),
		chainName: text('chain_name'),
		vendorId: text('vendor_id'),
		vendorName: text('vendor_name'),

		// Product
		productId: text('product_id'),
		productName: text('product_name'),

		// Targeting
		keyword: text('keyword'),
		assetType: text('asset_type'),
		biddingType: text('bidding_type'),
		placement: text('placement'),

		// Campaign
		campaignId: text('campaign_id'),
		campaignName: text('campaign_name'),
		campaignDescription: text('campaign_description'),
		campaignStatus: text('campaign_status'),
		campaignType: text('campaign_type'),
		campaignBudget: doublePrecision('campaign_budget'),
		campaignStartDate: date('campaign_start_date'),
		campaignEndDate: date('campaign_end_date'),
		campaignCreatedBy: text('campaign_created_by'),

		// Wallet
		walletId: text('wallet_id'),
		walletName: text('wallet_name'),
		walletBookingOrderId: text('wallet_booking_order_id'),
		walletCreatedBalance: doublePrecision('wallet_created_balance'),
		walletRemainingBalance: doublePrecision('wallet_remaining_balance'),
		walletCreatedBy: text('wallet_created_by'),
		walletStartDate: date('wallet_start_date'),
		walletEndDate: date('wallet_end_date'),
		walletPaymentMode: text('wallet_payment_mode'),

		// Performance Metrics
		impressions: integer('impressions').default(0),
		clicks: integer('clicks').default(0),
		ctr: doublePrecision('ctr').default(0),
		orders: integer('orders').default(0),
		cvr: doublePrecision('cvr').default(0),
		unitsSold: integer('units_sold').default(0),
		averageAdPosition: doublePrecision('average_ad_position'),

		// Cost Metrics
		totalAdSpend: doublePrecision('total_ad_spend').default(0),
		cpc: doublePrecision('cpc').default(0),
		cpa: doublePrecision('cpa').default(0),
		roas: doublePrecision('roas').default(0),
		salesRevenue: doublePrecision('sales_revenue').default(0),

		// Metadata
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow()
	},
	(table) => [
		index('idx_reports_date').on(table.reportDate),
		index('idx_reports_country').on(table.country),
		index('idx_reports_brand').on(table.brand),
		index('idx_reports_product_id').on(table.productId),
		index('idx_reports_product_name').on(table.productName),
		index('idx_reports_category').on(table.category),
		index('idx_reports_subcategory').on(table.subcategory),
		index('idx_reports_keyword').on(table.keyword),
		index('idx_reports_campaign_id').on(table.campaignId),
		index('idx_reports_campaign_status').on(table.campaignStatus),
		index('idx_reports_vendor_id').on(table.vendorId)
	]
);

// ============================================================
// SELLOUT TABLE (Sales Data)
// Source: *_Sellout_Categorized.xlsx files
// ============================================================

export const sellout = pgTable(
	'sellout',
	{
		id: text('id').primaryKey(),

		// Source & Date
		sourceFile: text('source_file'),
		reportDate: date('report_date'),
		reportMonth: text('report_month'),

		// Geographic
		country: text('country'),
		city: text('city'),

		// Company & Brand
		company: text('company'),
		brand: text('brand'),

		// Category
		category: text('category'),
		finalCategory: text('final_category'),

		// Product
		sku: text('sku'),
		barcode: text('barcode'),

		// Sales Metrics
		averageSalePrice: doublePrecision('average_sale_price'),
		totalQuantity: integer('total_quantity'),
		totalRevenue: doublePrecision('total_revenue'),

		// Metadata
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow()
	},
	(table) => [
		index('idx_sellout_date').on(table.reportDate),
		index('idx_sellout_month').on(table.reportMonth),
		index('idx_sellout_country').on(table.country),
		index('idx_sellout_city').on(table.city),
		index('idx_sellout_company').on(table.company),
		index('idx_sellout_brand').on(table.brand),
		index('idx_sellout_category').on(table.category),
		index('idx_sellout_sku').on(table.sku),
		index('idx_sellout_barcode').on(table.barcode)
	]
);

// ============================================================
// Type Exports
// ============================================================

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;

export type Sellout = typeof sellout.$inferSelect;
export type NewSellout = typeof sellout.$inferInsert;
