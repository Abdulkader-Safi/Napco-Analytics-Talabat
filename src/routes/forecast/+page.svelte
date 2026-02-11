<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { createSvelteTable, FlexRender, renderSnippet } from '$lib/components/ui/data-table';
	import {
		type Column,
		type ColumnDef,
		type SortingState,
		type PaginationState,
		getCoreRowModel,
		getSortedRowModel,
		getPaginationRowModel
	} from '@tanstack/table-core';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import DollarSignIcon from '@lucide/svelte/icons/dollar-sign';
	import ShoppingCartIcon from '@lucide/svelte/icons/shopping-cart';
	import PackageIcon from '@lucide/svelte/icons/package';
	import MousePointerClickIcon from '@lucide/svelte/icons/mouse-pointer-click';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import type { ProductForecast } from '$lib/forecast';

	let { data, form } = $props();

	// --- Form state ---
	let campaignType = $state<'listing' | 'search'>('listing');
	let selectedProducts = $state<string[]>([]);
	let selectedCategory = $state('');
	let selectedKeywords = $state<string[]>([]);
	let keywordSearch = $state('');
	let budget = $state('');
	let startDate = $state('');
	let endDate = $state('');
	let productSearch = $state('');
	let showDailyBreakdown = $state(false);

	// Restore form state from action result
	$effect(() => {
		if (form?.input) {
			campaignType = form.input.campaignType as 'listing' | 'search';
			selectedProducts = form.input.productNames;
			selectedCategory = form.input.category ?? '';
			selectedKeywords = form.input.keywords ?? [];
			budget = String(form.input.budget);
			startDate = form.input.startDate;
			endDate = form.input.endDate;
		}
	});

	const filteredKeywords = $derived(
		data.keywords.filter(
			(k) => !keywordSearch || k.name.toLowerCase().includes(keywordSearch.toLowerCase())
		)
	);

	function toggleKeyword(name: string) {
		if (selectedKeywords.includes(name)) {
			selectedKeywords = selectedKeywords.filter((k) => k !== name);
		} else {
			selectedKeywords = [...selectedKeywords, name];
		}
		selectedProducts = [];
	}

	const filteredProducts = $derived(
		data.products.filter((p) => {
			const matchesSearch =
				!productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase());
			const matchesType = campaignType === 'listing' ? p.hasListing : p.hasSearch;
			// Filter by category when in listing mode
			const matchesCategory =
				campaignType !== 'listing' || !selectedCategory || p.categories.includes(selectedCategory);
			// Filter by keywords when in search mode
			const matchesKeywords =
				campaignType !== 'search' ||
				selectedKeywords.length === 0 ||
				selectedKeywords.some((kw) => p.keywords.includes(kw));
			return (
				matchesSearch &&
				(matchesType || p.confidence === 'low') &&
				matchesCategory &&
				matchesKeywords
			);
		})
	);

	function toggleProduct(name: string) {
		if (selectedProducts.includes(name)) {
			selectedProducts = selectedProducts.filter((p) => p !== name);
		} else {
			selectedProducts = [...selectedProducts, name];
		}
	}

	// --- Results table ---
	type ProductRow = ProductForecast;

	let sorting = $state<SortingState>([]);
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 25 });

	const columns: ColumnDef<ProductRow>[] = [
		{
			accessorKey: 'productName',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Product' }),
			cell: ({ row }) => row.getValue('productName') ?? 'N/A'
		},
		{
			accessorKey: 'confidence',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Confidence' }),
			cell: ({ row }) => {
				const conf = row.getValue('confidence') as string;
				return renderSnippet(confidenceBadge, { confidence: conf });
			}
		},
		{
			accessorKey: 'budget',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Budget' }),
			cell: ({ row }) => `${(row.getValue('budget') as number).toFixed(2)} KWD`
		},
		{
			accessorKey: 'estimatedSpend',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Est. Spend' }),
			cell: ({ row }) => `${(row.getValue('estimatedSpend') as number).toFixed(2)} KWD`
		},
		{
			accessorKey: 'estimatedRevenue',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Est. Revenue' }),
			cell: ({ row }) => `${(row.getValue('estimatedRevenue') as number).toFixed(2)} KWD`
		},
		{
			accessorKey: 'estimatedOrders',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Orders' }),
			cell: ({ row }) => row.getValue('estimatedOrders')
		},
		{
			accessorKey: 'estimatedUnits',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Units' }),
			cell: ({ row }) => row.getValue('estimatedUnits')
		},
		{
			accessorKey: 'roas',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'ROAS' }),
			cell: ({ row }) => {
				const roas = row.getValue('roas') as number;
				return renderSnippet(roasBadge, { roas });
			}
		}
	];

	const table = createSvelteTable({
		get data() {
			return (form?.result?.products ?? []) as ProductRow[];
		},
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: (updater) => {
			sorting = typeof updater === 'function' ? updater(sorting) : updater;
		},
		onPaginationChange: (updater) => {
			pagination = typeof updater === 'function' ? updater(pagination) : updater;
		},
		state: {
			get sorting() {
				return sorting;
			},
			get pagination() {
				return pagination;
			}
		}
	});
</script>

{#snippet sortableHeader({ column, label }: { column: Column<ProductRow, unknown>; label: string })}
	<button
		class="flex items-center gap-1 hover:text-foreground"
		onclick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
	>
		{label}
		{#if column.getIsSorted() === 'asc'}
			<ArrowUpIcon class="size-4" />
		{:else if column.getIsSorted() === 'desc'}
			<ArrowDownIcon class="size-4" />
		{:else}
			<ArrowUpDownIcon class="size-4 text-muted-foreground" />
		{/if}
	</button>
{/snippet}

{#snippet roasBadge({ roas }: { roas: number })}
	{@const variant = roas >= 1 ? 'default' : 'destructive'}
	<Badge {variant} class="tabular-nums">
		{(roas * 100).toFixed(0)}%
	</Badge>
{/snippet}

{#snippet confidenceBadge({ confidence }: { confidence: string })}
	{#if confidence === 'high'}
		<Badge variant="default">High</Badge>
	{:else if confidence === 'medium'}
		<Badge variant="secondary">Medium</Badge>
	{:else}
		<Badge variant="outline">Low</Badge>
	{/if}
{/snippet}

<Sidebar.Provider>
	<AppSidebar user={data.user} />
	<Sidebar.Inset>
		<header class="flex h-16 shrink-0 items-center gap-2">
			<div class="flex items-center gap-2 px-4">
				<Sidebar.Trigger class="-ms-1" />
				<Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item>
							<Breadcrumb.Page>Forecast</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
		</header>
		<div class="flex flex-1 flex-col gap-6 p-4 pt-0">
			<!-- Input Form -->
			<Card.Root>
				<Card.Header>
					<Card.Title>Ad Sales Forecast</Card.Title>
					<Card.Description>
						Predict revenue, orders, and units for your ad campaigns. Model built from {data
							.metadata.productCount} products and {data.metadata.keywordCount} keywords.
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<form method="POST" action="?/forecast" class="space-y-6">
						<!-- Campaign Type Toggle -->
						<div class="space-y-2">
							<span class="text-sm font-medium">Campaign Type</span>
							<div class="flex gap-2">
								<button
									type="button"
									class="rounded-md border px-4 py-2 text-sm font-medium transition-colors {campaignType ===
									'listing'
										? 'bg-primary text-primary-foreground'
										: 'bg-background hover:bg-muted'}"
									onclick={() => {
										campaignType = 'listing';
										selectedProducts = [];
									}}
								>
									Listing
								</button>
								<button
									type="button"
									class="rounded-md border px-4 py-2 text-sm font-medium transition-colors {campaignType ===
									'search'
										? 'bg-primary text-primary-foreground'
										: 'bg-background hover:bg-muted'}"
									onclick={() => {
										campaignType = 'search';
										selectedProducts = [];
									}}
								>
									Search
								</button>
							</div>
							<input type="hidden" name="campaignType" value={campaignType} />
						</div>

						<!-- Category (listing only) -->
						{#if campaignType === 'listing'}
							<div class="space-y-2">
								<label for="category" class="text-sm font-medium">Category</label>
								<select
									id="category"
									name="category"
									bind:value={selectedCategory}
									onchange={() => {
										selectedProducts = [];
									}}
									class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
								>
									<option value="">All categories</option>
									{#each data.categories as cat (cat.name)}
										<option value={cat.name}>
											{cat.name} (ROAS: {(cat.roas * 100).toFixed(0)}%)
										</option>
									{/each}
								</select>
							</div>
						{/if}

						<!-- Keywords (search only) -->
						{#if campaignType === 'search'}
							<div class="space-y-2">
								<label for="keywordSearch" class="text-sm font-medium">
									Keywords ({selectedKeywords.length} selected)
								</label>
								<Input
									id="keywordSearch"
									type="text"
									placeholder="Search keywords..."
									bind:value={keywordSearch}
								/>
								<div class="max-h-48 overflow-y-auto rounded-md border p-2">
									{#each filteredKeywords as kw (kw.name)}
										<label
											class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
										>
											<input
												type="checkbox"
												name="keywords"
												value={kw.name}
												checked={selectedKeywords.includes(kw.name)}
												onchange={() => toggleKeyword(kw.name)}
												class="rounded"
											/>
											<span class="flex-1 truncate">{kw.name}</span>
											<Badge variant="secondary" class="text-xs tabular-nums">
												{(kw.roas * 100).toFixed(0)}%
											</Badge>
										</label>
									{/each}
									{#if filteredKeywords.length === 0}
										<p class="py-2 text-center text-sm text-muted-foreground">No keywords found</p>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Products Multi-select -->
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<label for="productSearch" class="text-sm font-medium">
									Products ({selectedProducts.length} selected)
									{#if campaignType === 'listing' && selectedCategory}
										<span class="text-muted-foreground">— filtered by {selectedCategory}</span>
									{:else if campaignType === 'search' && selectedKeywords.length > 0}
										<span class="text-muted-foreground"
											>— filtered by {selectedKeywords.length} keyword{selectedKeywords.length > 1
												? 's'
												: ''}</span
										>
									{/if}
								</label>
								<button
									type="button"
									class="text-xs text-muted-foreground hover:text-foreground"
									onclick={() => {
										if (selectedProducts.length === filteredProducts.length) {
											selectedProducts = [];
										} else {
											selectedProducts = filteredProducts.map((p) => p.name);
										}
									}}
								>
									{selectedProducts.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
								</button>
							</div>
							<Input
								id="productSearch"
								type="text"
								placeholder="Search products..."
								bind:value={productSearch}
							/>
							<div class="max-h-48 overflow-y-auto rounded-md border p-2">
								{#each filteredProducts as product (product.name)}
									<label
										class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
									>
										<input
											type="checkbox"
											name="products"
											value={product.name}
											checked={selectedProducts.includes(product.name)}
											onchange={() => toggleProduct(product.name)}
											class="rounded"
										/>
										<span class="flex-1 truncate">{product.name}</span>
										{#if product.confidence === 'high'}
											<Badge variant="default" class="text-xs">High</Badge>
										{:else if product.confidence === 'medium'}
											<Badge variant="secondary" class="text-xs">Med</Badge>
										{:else}
											<Badge variant="outline" class="text-xs">Low</Badge>
										{/if}
									</label>
								{/each}
								{#if filteredProducts.length === 0}
									<p class="py-2 text-center text-sm text-muted-foreground">No products found</p>
								{/if}
							</div>
							<p class="text-xs text-muted-foreground">
								<strong>High:</strong> 50+ days &amp; 30+ KWD historical data.
								<strong>Med:</strong> 20+ days &amp; 10+ KWD.
								<strong>Low:</strong> limited data, uses global averages.
							</p>
						</div>

						<!-- Budget & Dates -->
						<div class="grid gap-4 sm:grid-cols-3">
							<div class="space-y-2">
								<label for="budget" class="text-sm font-medium">Budget (KWD)</label>
								<Input
									id="budget"
									name="budget"
									type="number"
									step="0.01"
									min="1"
									placeholder="100"
									bind:value={budget}
								/>
							</div>
							<div class="space-y-2">
								<label for="startDate" class="text-sm font-medium">Start Date</label>
								<Input id="startDate" name="startDate" type="date" bind:value={startDate} />
							</div>
							<div class="space-y-2">
								<label for="endDate" class="text-sm font-medium">End Date</label>
								<Input id="endDate" name="endDate" type="date" bind:value={endDate} />
							</div>
						</div>

						{#if form?.error}
							<p class="text-sm text-destructive">{form.error}</p>
						{/if}

						<Button type="submit" class="w-full sm:w-auto">
							<TrendingUpIcon class="mr-2 size-4" />
							Generate Forecast
						</Button>
					</form>
				</Card.Content>
			</Card.Root>

			<!-- Results -->
			{#if form?.success && form?.result}
				{@const result = form.result}

				<!-- Summary Cards -->
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
							<Card.Title class="text-sm font-medium">Est. Revenue</Card.Title>
							<DollarSignIcon class="size-4 text-muted-foreground" />
						</Card.Header>
						<Card.Content>
							<div class="text-2xl font-bold">{result.totalRevenue.toFixed(2)}</div>
							<p class="text-xs text-muted-foreground">KWD</p>
						</Card.Content>
					</Card.Root>
					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
							<Card.Title class="text-sm font-medium">Est. Orders</Card.Title>
							<ShoppingCartIcon class="size-4 text-muted-foreground" />
						</Card.Header>
						<Card.Content>
							<div class="text-2xl font-bold">{result.totalOrders}</div>
							<p class="text-xs text-muted-foreground">total orders</p>
						</Card.Content>
					</Card.Root>
					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
							<Card.Title class="text-sm font-medium">Est. Units</Card.Title>
							<PackageIcon class="size-4 text-muted-foreground" />
						</Card.Header>
						<Card.Content>
							<div class="text-2xl font-bold">{result.totalUnits}</div>
							<p class="text-xs text-muted-foreground">units sold</p>
						</Card.Content>
					</Card.Root>
					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
							<Card.Title class="text-sm font-medium">ROAS</Card.Title>
							<TrendingUpIcon class="size-4 text-muted-foreground" />
						</Card.Header>
						<Card.Content>
							<div class="text-2xl font-bold">{(result.roas * 100).toFixed(0)}%</div>
							<p class="text-xs text-muted-foreground">return on ad spend</p>
						</Card.Content>
					</Card.Root>
					<Card.Root>
						<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
							<Card.Title class="text-sm font-medium">Est. Clicks</Card.Title>
							<MousePointerClickIcon class="size-4 text-muted-foreground" />
						</Card.Header>
						<Card.Content>
							<div class="text-2xl font-bold">{result.totalClicks.toLocaleString()}</div>
							<p class="text-xs text-muted-foreground">spend: {result.totalSpend.toFixed(2)} KWD</p>
						</Card.Content>
					</Card.Root>
				</div>

				<!-- Per-product Table -->
				<div class="space-y-2">
					<h2 class="text-xl font-semibold tracking-tight">Per-Product Forecast</h2>
					<div class="rounded-md border">
						<Table.Root>
							<Table.Header>
								{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
									<Table.Row>
										{#each headerGroup.headers as header (header.id)}
											<Table.Head>
												{#if !header.isPlaceholder}
													<FlexRender
														content={header.column.columnDef.header}
														context={header.getContext()}
													/>
												{/if}
											</Table.Head>
										{/each}
									</Table.Row>
								{/each}
							</Table.Header>
							<Table.Body>
								{#each table.getRowModel().rows as row (row.id)}
									<Table.Row>
										{#each row.getVisibleCells() as cell (cell.id)}
											<Table.Cell>
												<FlexRender
													content={cell.column.columnDef.cell}
													context={cell.getContext()}
												/>
											</Table.Cell>
										{/each}
									</Table.Row>
								{:else}
									<Table.Row>
										<Table.Cell colspan={columns.length} class="h-24 text-center">
											No results.
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
					{#if table.getPageCount() > 1}
						<div class="flex items-center justify-between px-2">
							<div class="text-sm text-muted-foreground">
								Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
							</div>
							<div class="flex items-center space-x-2">
								<Button
									variant="outline"
									size="sm"
									onclick={() => table.previousPage()}
									disabled={!table.getCanPreviousPage()}
								>
									<ChevronLeftIcon class="size-4" />
								</Button>
								<Button
									variant="outline"
									size="sm"
									onclick={() => table.nextPage()}
									disabled={!table.getCanNextPage()}
								>
									<ChevronRightIcon class="size-4" />
								</Button>
							</div>
						</div>
					{/if}
					<p class="text-xs text-muted-foreground">
						Confidence reflects how much historical data is available for each product.
						<strong>High:</strong> 50+ active days &amp; 30+ KWD spend.
						<strong>Medium:</strong> 20+ days &amp; 10+ KWD.
						<strong>Low:</strong> limited data, relies on global averages.
					</p>
				</div>

				<!-- Daily Breakdown -->
				{#if result.aggregatedDaily && result.aggregatedDaily.length > 0}
					<div class="space-y-2">
						<button
							class="flex items-center gap-2 text-xl font-semibold tracking-tight hover:text-foreground"
							onclick={() => (showDailyBreakdown = !showDailyBreakdown)}
						>
							Daily Breakdown
							<ChevronDownIcon
								class="size-5 transition-transform {showDailyBreakdown ? 'rotate-180' : ''}"
							/>
						</button>
						{#if showDailyBreakdown}
							<div class="max-h-96 overflow-y-auto rounded-md border">
								<Table.Root>
									<Table.Header>
										<Table.Row>
											<Table.Head>Date</Table.Head>
											<Table.Head>Spend (KWD)</Table.Head>
											<Table.Head>Revenue (KWD)</Table.Head>
											<Table.Head>Orders</Table.Head>
											<Table.Head>Seasonality</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each result.aggregatedDaily as day (day.date)}
											<Table.Row>
												<Table.Cell>{day.date}</Table.Cell>
												<Table.Cell>{day.spend.toFixed(2)}</Table.Cell>
												<Table.Cell>{day.revenue.toFixed(2)}</Table.Cell>
												<Table.Cell>{day.orders.toFixed(1)}</Table.Cell>
												<Table.Cell>
													<Badge
														variant={day.seasonalityFactor >= 1 ? 'default' : 'outline'}
														class="tabular-nums"
													>
														{day.seasonalityFactor.toFixed(3)}
													</Badge>
												</Table.Cell>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
							</div>
							<p class="text-xs text-muted-foreground">
								Seasonality is a combined multiplier of monthly performance and day-of-week
								performance relative to the overall average. A value above 1.0 means that day is
								expected to perform better than average, below 1.0 means worse. For example, 1.08 =
								8% above average, 0.92 = 8% below average.
							</p>
						{/if}
					</div>
				{/if}
			{/if}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
