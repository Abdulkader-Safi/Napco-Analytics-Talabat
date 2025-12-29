import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	processReportFile,
	processSelloutFile,
	clearReportsData,
	clearSelloutData,
	getReportsCount,
	getSelloutCount,
	detectFileType
} from '$lib/server/services/excelImporter';

// POST /api/upload - Upload files (auto-detect type from filename)
export const POST: RequestHandler = async ({ request, locals, url }) => {
	// Auth check
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const formData = await request.formData();
		const files = formData.getAll('files') as File[];
		const forceType = url.searchParams.get('type') as 'report' | 'sellout' | null;

		if (files.length === 0) {
			throw error(400, 'No files provided');
		}

		const results: {
			reports: { filename: string; recordsInserted: number; error?: string }[];
			sellout: { filename: string; recordsInserted: number; error?: string }[];
		} = {
			reports: [],
			sellout: []
		};

		let totalReportsInserted = 0;
		let totalSelloutInserted = 0;
		const errors: string[] = [];

		// Process each file
		for (const file of files) {
			const buffer = await file.arrayBuffer();
			const fileType = forceType || detectFileType(file.name);

			if (fileType === 'report') {
				const result = await processReportFile(buffer, file.name);
				results.reports.push(result);
				if (result.error) {
					errors.push(`${file.name}: ${result.error}`);
				} else {
					totalReportsInserted += result.recordsInserted;
				}
			} else if (fileType === 'sellout') {
				const result = await processSelloutFile(buffer, file.name);
				results.sellout.push(result);
				if (result.error) {
					errors.push(`${file.name}: ${result.error}`);
				} else {
					totalSelloutInserted += result.recordsInserted;
				}
			} else {
				errors.push(
					`${file.name}: Unknown file type. File must contain 'Report' or 'Sellout' in name.`
				);
			}
		}

		return json({
			success: true,
			stats: {
				totalFiles: files.length,
				reportsInserted: totalReportsInserted,
				selloutInserted: totalSelloutInserted,
				errors
			},
			results
		});
	} catch (err) {
		console.error('Upload error:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, err instanceof Error ? err.message : 'Upload failed');
	}
};

// DELETE /api/upload - Clear data
// Use ?type=reports or ?type=sellout to clear specific table
// Use ?type=all to clear both
export const DELETE: RequestHandler = async ({ locals, url }) => {
	// Auth check
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const type = url.searchParams.get('type') || 'all';

	try {
		let reportsDeleted = 0;
		let selloutDeleted = 0;

		if (type === 'reports' || type === 'all') {
			reportsDeleted = await clearReportsData();
		}

		if (type === 'sellout' || type === 'all') {
			selloutDeleted = await clearSelloutData();
		}

		return json({
			success: true,
			deleted: {
				reports: reportsDeleted,
				sellout: selloutDeleted,
				total: reportsDeleted + selloutDeleted
			}
		});
	} catch (err) {
		console.error('Clear data error:', err);
		throw error(500, err instanceof Error ? err.message : 'Failed to clear data');
	}
};

// GET /api/upload - Get record counts
export const GET: RequestHandler = async ({ locals }) => {
	// Auth check
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const reportsCount = await getReportsCount();
		const selloutCount = await getSelloutCount();

		return json({
			success: true,
			counts: {
				reports: reportsCount,
				sellout: selloutCount,
				total: reportsCount + selloutCount
			}
		});
	} catch (err) {
		console.error('Get count error:', err);
		throw error(500, err instanceof Error ? err.message : 'Failed to get data count');
	}
};
