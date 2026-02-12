import type { PageServerLoad, Actions } from './$types';
import {
	forecast,
	getAvailableProducts,
	getCategories,
	getKeywords,
	getModelMetadata,
	type ForecastInput,
	type ForecastResult
} from '$lib/forecast';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const products = getAvailableProducts();
	const categories = getCategories();
	const keywords = getKeywords();
	const metadata = getModelMetadata();

	return { products, categories, keywords, metadata };
};

export const actions: Actions = {
	forecast: async ({ request }) => {
		const formData = await request.formData();

		const campaignType = formData.get('campaignType') as string;
		const productNames = formData.getAll('products') as string[];
		const budgetStr = formData.get('budget') as string;
		const budget = parseFloat(budgetStr);
		const startDate = formData.get('startDate') as string;
		const endDate = formData.get('endDate') as string;
		const category = (formData.get('category') as string) || undefined;
		const keywordsAll = formData.getAll('keywords') as string[];
		const keywords = keywordsAll.length > 0 ? keywordsAll : undefined;

		const input = {
			campaignType,
			productNames,
			category,
			keywords,
			budget,
			startDate,
			endDate
		};

		if (campaignType !== 'listing' && campaignType !== 'search') {
			return fail(400, { error: 'Invalid campaign type', input });
		}

		if (productNames.length === 0) {
			return fail(400, { error: 'Select at least one product', input });
		}

		if (isNaN(budget) || budget <= 0) {
			return fail(400, { error: 'Enter a valid budget', input });
		}

		if (!startDate || !endDate) {
			return fail(400, { error: 'Select start and end dates', input });
		}
		if (startDate > endDate) {
			return fail(400, { error: 'Start date must be before end date', input });
		}

		const result: ForecastResult = forecast(input as ForecastInput);

		return {
			success: true,
			result,
			input
		};
	}
};
