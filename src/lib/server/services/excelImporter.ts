import * as XLSX from 'xlsx';
import { db } from '../db';
import {
	reports,
	sellout,
	type NewReport,
	type NewSellout
} from '../db/schema';
import { sql } from 'drizzle-orm';

// ============================================================
// File Type Detection
// ============================================================

export type FileType = 'report' | 'sellout' | 'unknown';

export function detectFileType(filename: string): FileType {
	const lowerName = filename.toLowerCase();
	if (lowerName.includes('report')) {
		return 'report';
	}
	if (lowerName.includes('sellout')) {
		return 'sellout';
	}
	return 'unknown';
}

// ============================================================
// Subcategory to Category Mapping
// ============================================================

const subcategoryToCategoryMap: Record<string, string> = {
	'1 - 2 Years': 'Baby Care',
	'2 - 3 Years': 'Baby Care',
	'3+ Years': 'Baby Care',
	'6 - 12 Months': 'Baby Care',
	'Size 6+': 'Baby Care',
	'Baby Wipes': 'Baby Care',
	'Feminine Pads': 'Feminine Care',
	'Panty Liners': 'Feminine Care',
	'Aluminum Foil': 'Household Care',
	'Baking Paper': 'Household Care',
	'Cling Film': 'Household Care',
	'Cotton Buds & Pads': 'Household Care',
	'Cups & Straws': 'Household Care',
	'Facial Tissues': 'Household Care',
	'Food Storage Bags': 'Household Care',
	'Kitchen Rolls': 'Household Care',
	'Large Bags': 'Household Care',
	'Medium Bags': 'Household Care',
	'Small Bags': 'Household Care',
	'Table Covers': 'Household Care',
	'Toilet Paper': 'Household Care'
};

function getCategoryFromSubcategory(subcategory: string | null): string | null {
	if (!subcategory) return null;
	return subcategoryToCategoryMap[subcategory] ?? null;
}

// ============================================================
// Month Extraction from Filename
// ============================================================

const monthMap: Record<string, { month: string; num: string }> = {
	january: { month: 'January', num: '01' },
	jan: { month: 'January', num: '01' },
	february: { month: 'February', num: '02' },
	feb: { month: 'February', num: '02' },
	march: { month: 'March', num: '03' },
	mar: { month: 'March', num: '03' },
	april: { month: 'April', num: '04' },
	apr: { month: 'April', num: '04' },
	may: { month: 'May', num: '05' },
	june: { month: 'June', num: '06' },
	jun: { month: 'June', num: '06' },
	july: { month: 'July', num: '07' },
	jul: { month: 'July', num: '07' },
	august: { month: 'August', num: '08' },
	aug: { month: 'August', num: '08' },
	september: { month: 'September', num: '09' },
	sep: { month: 'September', num: '09' },
	october: { month: 'October', num: '10' },
	oct: { month: 'October', num: '10' },
	november: { month: 'November', num: '11' },
	nov: { month: 'November', num: '11' },
	december: { month: 'December', num: '12' },
	dec: { month: 'December', num: '12' }
};

export function extractMonthFromFilename(
	filename: string
): { reportMonth: string | null; reportDate: string | null } {
	const lowerName = filename.toLowerCase();

	for (const [key, val] of Object.entries(monthMap)) {
		if (lowerName.includes(key)) {
			// Try to extract year (4 digits)
			const yearMatch = filename.match(/20\d{2}/);
			const year = yearMatch ? yearMatch[0] : '2025';
			return {
				reportMonth: val.month,
				reportDate: `${year}-${val.num}-15`
			};
		}
	}

	return { reportMonth: null, reportDate: null };
}

// ============================================================
// Excel Parsing Helpers
// ============================================================

function parseExcelDate(value: unknown): string | null {
	if (!value) return null;

	// If it's a number (Excel serial date)
	if (typeof value === 'number') {
		const date = XLSX.SSF.parse_date_code(value);
		if (date) {
			const year = date.y;
			const month = String(date.m).padStart(2, '0');
			const day = String(date.d).padStart(2, '0');
			return `${year}-${month}-${day}`;
		}
	}

	// If it's a string, try to parse it
	if (typeof value === 'string') {
		const parsed = new Date(value);
		if (!isNaN(parsed.getTime())) {
			const year = parsed.getFullYear();
			const month = String(parsed.getMonth() + 1).padStart(2, '0');
			const day = String(parsed.getDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		}
	}

	// If it's already a Date
	if (value instanceof Date) {
		const year = value.getFullYear();
		const month = String(value.getMonth() + 1).padStart(2, '0');
		const day = String(value.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	return null;
}

function parseNumber(value: unknown): number | null {
	if (value === null || value === undefined || value === '') return null;
	const num = Number(value);
	return isNaN(num) ? null : num;
}

function parseString(value: unknown): string | null {
	if (value === null || value === undefined || value === '') return null;
	return String(value).trim();
}

// ============================================================
// Report Row Mapper
// ============================================================

export function mapReportRow(
	row: Record<string, unknown>,
	filename: string
): NewReport {
	const subcategory = parseString(row['Category Name (L2)']);
	const category = getCategoryFromSubcategory(subcategory);

	return {
		id: crypto.randomUUID(),
		sourceFile: filename,
		reportDate: parseExcelDate(row['Date']),
		country: parseString(row['Country']),
		currency: parseString(row['Currency']),
		accountId: parseString(row['Account ID']),
		accountName: parseString(row['Account Name']),
		accountBillingName: parseString(row['Account Billing Name']),
		accountType: parseString(row['Account Type']),
		brandOwner: parseString(row['Brand Owner']),
		brand: parseString(row['Brands']),
		category,
		subcategory,
		categoryId: parseString(row['Category ID']),
		chainId: parseString(row['Chain ID']),
		chainName: parseString(row['Chain Name']),
		vendorId: parseString(row['Vendor ID']),
		vendorName: parseString(row['Vendor Name']),
		productId: parseString(row['Product ID']),
		productName: parseString(row['Product Name']),
		keyword: parseString(row['Keyword']),
		assetType: parseString(row['Asset Type']),
		biddingType: parseString(row['Bidding Type']),
		placement: parseString(row['Placement']),
		campaignId: parseString(row['Campaign ID']),
		campaignName: parseString(row['Campaign Name']),
		campaignDescription: parseString(row['Campaign Description']),
		campaignStatus: parseString(row['Campaign Status']),
		campaignType: parseString(row['Campaign Type']),
		campaignBudget: parseNumber(row['Campaign Budget']),
		campaignStartDate: parseExcelDate(row['Campaign Start Date']),
		campaignEndDate: parseExcelDate(row['Campaign End Date']),
		campaignCreatedBy: parseString(row['Campaign Created By ']) || parseString(row['Campaign Created By']),
		walletId: parseString(row['Wallet ID']),
		walletName: parseString(row['Wallet Name']),
		walletBookingOrderId: parseString(row['Wallet Booking Order ID']),
		walletCreatedBalance: parseNumber(row['Wallet Created Balance']),
		walletRemainingBalance: parseNumber(row['Wallet Remaining Balance']),
		walletCreatedBy: parseString(row['Wallet Created by']),
		walletStartDate: parseExcelDate(row['Wallet Start Date']),
		walletEndDate: parseExcelDate(row['Wallet End Date']),
		walletPaymentMode: parseString(row['Wallet Payment Mode']),
		impressions: parseNumber(row['Impressions']) ?? 0,
		clicks: parseNumber(row['Clicks']) ?? 0,
		ctr: parseNumber(row['CTR']) ?? 0,
		orders: parseNumber(row['Orders']) ?? 0,
		cvr: parseNumber(row['CVR']) ?? 0,
		unitsSold: parseNumber(row['Unit Sold']) ?? 0,
		averageAdPosition: parseNumber(row['Average Ad Position']),
		totalAdSpend: parseNumber(row['Total Ad Spend']) ?? 0,
		cpc: parseNumber(row['CPC']) ?? 0,
		cpa: parseNumber(row['CPA']) ?? 0,
		roas: parseNumber(row['ROAS']) ?? 0,
		salesRevenue: parseNumber(row['Sales Revenue']) ?? 0
	};
}

// ============================================================
// Sellout Row Mapper
// ============================================================

export function mapSelloutRow(
	row: Record<string, unknown>,
	filename: string
): NewSellout {
	const { reportMonth, reportDate } = extractMonthFromFilename(filename);

	// Handle barcode - convert to string if it's a number
	let barcode = row['Barcodes'];
	if (typeof barcode === 'number') {
		barcode = String(barcode);
	}

	return {
		id: crypto.randomUUID(),
		sourceFile: filename,
		reportDate,
		reportMonth,
		country: parseString(row['Country']),
		city: parseString(row['City']),
		company: parseString(row['Top 5 Companies']),
		brand: parseString(row['Brand']),
		category: parseString(row['Category']),
		finalCategory: parseString(row['Final Category']),
		sku: parseString(row['SKU']),
		barcode: parseString(barcode),
		averageSalePrice: parseNumber(row['Average Sale Price']),
		totalQuantity: parseNumber(row['Total Quantity']),
		totalRevenue: parseNumber(row['Total Revenue'])
	};
}

// ============================================================
// Excel File Parsers
// ============================================================

export interface ReportParseResult {
	records: NewReport[];
	rowCount: number;
}

export interface SelloutParseResult {
	records: NewSellout[];
	rowCount: number;
}

export function parseReportFile(buffer: ArrayBuffer, filename: string): ReportParseResult {
	const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
	const sheetName = workbook.SheetNames[0];
	const worksheet = workbook.Sheets[sheetName];

	const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
	const records: NewReport[] = [];

	for (const row of rows) {
		try {
			const record = mapReportRow(row, filename);
			records.push(record);
		} catch (error) {
			console.error('Error mapping report row:', error, row);
		}
	}

	return { records, rowCount: rows.length };
}

export function parseSelloutFile(buffer: ArrayBuffer, filename: string): SelloutParseResult {
	const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
	const sheetName = workbook.SheetNames[0];
	const worksheet = workbook.Sheets[sheetName];

	const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
	const records: NewSellout[] = [];

	for (const row of rows) {
		try {
			const record = mapSelloutRow(row, filename);
			records.push(record);
		} catch (error) {
			console.error('Error mapping sellout row:', error, row);
		}
	}

	return { records, rowCount: rows.length };
}

// ============================================================
// Database Operations
// ============================================================

const BATCH_SIZE = 500;

export async function insertReportBatch(records: NewReport[]): Promise<number> {
	if (records.length === 0) return 0;

	let inserted = 0;

	for (let i = 0; i < records.length; i += BATCH_SIZE) {
		const batch = records.slice(i, i + BATCH_SIZE);
		await db.insert(reports).values(batch);
		inserted += batch.length;
	}

	return inserted;
}

export async function insertSelloutBatch(records: NewSellout[]): Promise<number> {
	if (records.length === 0) return 0;

	let inserted = 0;

	for (let i = 0; i < records.length; i += BATCH_SIZE) {
		const batch = records.slice(i, i + BATCH_SIZE);
		await db.insert(sellout).values(batch);
		inserted += batch.length;
	}

	return inserted;
}

export async function clearReportsData(): Promise<number> {
	const countResult = await db.select({ count: sql<number>`count(*)` }).from(reports);
	const count = Number(countResult[0]?.count ?? 0);
	await db.delete(reports);
	return count;
}

export async function clearSelloutData(): Promise<number> {
	const countResult = await db.select({ count: sql<number>`count(*)` }).from(sellout);
	const count = Number(countResult[0]?.count ?? 0);
	await db.delete(sellout);
	return count;
}

export async function getReportsCount(): Promise<number> {
	const result = await db.select({ count: sql<number>`count(*)` }).from(reports);
	return Number(result[0]?.count ?? 0);
}

export async function getSelloutCount(): Promise<number> {
	const result = await db.select({ count: sql<number>`count(*)` }).from(sellout);
	return Number(result[0]?.count ?? 0);
}

// ============================================================
// File Processing
// ============================================================

export interface ReportProcessResult {
	filename: string;
	recordsInserted: number;
	error?: string;
}

export interface SelloutProcessResult {
	filename: string;
	recordsInserted: number;
	error?: string;
}

export async function processReportFile(
	buffer: ArrayBuffer,
	filename: string
): Promise<ReportProcessResult> {
	try {
		const { records } = parseReportFile(buffer, filename);
		const recordsInserted = await insertReportBatch(records);

		return {
			filename,
			recordsInserted
		};
	} catch (error) {
		return {
			filename,
			recordsInserted: 0,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

export async function processSelloutFile(
	buffer: ArrayBuffer,
	filename: string
): Promise<SelloutProcessResult> {
	try {
		const { records } = parseSelloutFile(buffer, filename);
		const recordsInserted = await insertSelloutBatch(records);

		return {
			filename,
			recordsInserted
		};
	} catch (error) {
		return {
			filename,
			recordsInserted: 0,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}
