<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
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
		type ColumnFiltersState,
		getCoreRowModel,
		getSortedRowModel,
		getPaginationRowModel,
		getFilteredRowModel
	} from '@tanstack/table-core';
	import { RangeCalendar } from '$lib/components/ui/range-calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { type DateValue } from '@internationalized/date';
	import SearchIcon from '@lucide/svelte/icons/search';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import ChevronsLeftIcon from '@lucide/svelte/icons/chevrons-left';
	import ChevronsRightIcon from '@lucide/svelte/icons/chevrons-right';
	import XIcon from '@lucide/svelte/icons/x';

	let { data } = $props();

	type Campaign = {
		campaignId: string | null;
		campaignName: string | null;
		currency: string | null;
		startDate: string | null;
		endDate: string | null;
		productsCount: number;
		keywordsCount: number;
		categoriesCount: number;
		totalRevenue: number;
		totalClicks: number;
		totalOrders: number;
		avgRoas: number;
		assetTypes: string[] | null;
		topKeyword: string | null;
		topCategory: string | null;
	};

	// --- Campaigns table state ---
	let sorting = $state<SortingState>([{ id: 'totalRevenue', desc: true }]);
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 25 });
	let columnFilters = $state<ColumnFiltersState>([]);
	let searchValue = $state('');
	let categoryFilter = $state('');
	let dateRange = $state<{ start: DateValue | undefined; end: DateValue | undefined }>({
		start: undefined,
		end: undefined
	});

	const categories = $derived(
		[
			...new Set((data.campaigns as Campaign[]).map((c) => c.topCategory).filter(Boolean))
		].sort() as string[]
	);

	function dateValueToString(d: DateValue): string {
		const y = d.year;
		const m = String(d.month).padStart(2, '0');
		const day = String(d.day).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}

	const filteredByDate = $derived(
		(data.campaigns as Campaign[]).filter((c) => {
			// Exclude if campaign ends before selected start (no overlap)
			if (dateRange.start && c.endDate && c.endDate < dateValueToString(dateRange.start))
				return false;
			// Exclude if campaign starts after selected end (no overlap)
			if (dateRange.end && c.startDate && c.startDate > dateValueToString(dateRange.end))
				return false;
			return true;
		})
	);

	const dateRangeLabel = $derived(() => {
		if (dateRange.start && dateRange.end) {
			return `${dateValueToString(dateRange.start)} — ${dateValueToString(dateRange.end)}`;
		}
		if (dateRange.start) {
			return `From ${dateValueToString(dateRange.start)}`;
		}
		return 'Pick date range';
	});

	const columns: ColumnDef<Campaign>[] = [
		{
			accessorKey: 'campaignName',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Campaign Name' }),
			cell: ({ row }) => row.getValue('campaignName') ?? 'N/A'
		},
		{
			accessorKey: 'avgRoas',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Average ROAS' }),
			cell: ({ row }) => {
				const roas = row.getValue('avgRoas') as number;
				return renderSnippet(roasBadge, { roas });
			}
		},
		{
			accessorKey: 'assetTypes',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Type' }),
			cell: ({ row }) => {
				const types = row.getValue('assetTypes') as string[] | null;
				return renderSnippet(assetTypeBadges, { types });
			}
		},
		{
			accessorKey: 'topKeyword',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Top Keyword' }),
			cell: ({ row }) => row.getValue('topKeyword') ?? '-'
		},
		{
			accessorKey: 'topCategory',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Top Category' }),
			cell: ({ row }) => {
				const category = row.getValue('topCategory') as string | null;
				return renderSnippet(categoryBadge, { category });
			}
		},
		{
			accessorKey: 'productsCount',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Products' }),
			cell: ({ row }) => {
				const campaignId = row.original.campaignId ?? '';
				const count = row.getValue('productsCount') as number;
				return renderSnippet(productsLink, { campaignId, count });
			}
		},
		{
			accessorKey: 'keywordsCount',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Keywords' }),
			cell: ({ row }) => {
				const campaignId = row.original.campaignId ?? '';
				const count = row.getValue('keywordsCount') as number;
				return renderSnippet(keywordsLink, { campaignId, count });
			}
		},
		{
			accessorKey: 'startDate',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Start Date' }),
			cell: ({ row }) => row.getValue('startDate') ?? 'N/A'
		},
		{
			accessorKey: 'endDate',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'End Date' }),
			cell: ({ row }) => row.getValue('endDate') ?? 'N/A'
		},
		{
			accessorKey: 'totalRevenue',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Total Revenue' }),
			cell: ({ row }) => {
				const revenue = row.getValue('totalRevenue') as number;
				const currency = row.original.currency ?? 'KWD';
				return `${(revenue ?? 0).toFixed(2)} ${currency}`;
			}
		},
		{
			accessorKey: 'totalClicks',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Total Clicks' }),
			cell: ({ row }) => row.getValue('totalClicks') ?? 0
		},
		{
			accessorKey: 'totalOrders',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Orders' }),
			cell: ({ row }) => row.getValue('totalOrders') ?? 0
		}
	];

	const table = createSvelteTable({
		get data() {
			return filteredByDate;
		},
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: (updater) => {
			sorting = typeof updater === 'function' ? updater(sorting) : updater;
		},
		onPaginationChange: (updater) => {
			pagination = typeof updater === 'function' ? updater(pagination) : updater;
		},
		onColumnFiltersChange: (updater) => {
			columnFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
		},
		state: {
			get sorting() {
				return sorting;
			},
			get pagination() {
				return pagination;
			},
			get columnFilters() {
				return columnFilters;
			}
		}
	});
</script>

{#snippet sortableHeader({ column, label }: { column: Column<Campaign, unknown>; label: string })}
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

{#snippet categoryBadge({ category }: { category: string | null })}
	{@const color =
		category === 'Baby Care'
			? '#A8E6CF'
			: category === 'Household Care'
				? '#B0BEC5'
				: category === 'Family Care'
					? '#FFD54F'
					: '#CE93D8'}
	{#if category}
		<Badge
			variant="outline"
			style="background-color: {color}; border-color: {color};"
			class="text-gray-800"
		>
			{category}
		</Badge>
	{:else}
		-
	{/if}
{/snippet}

{#snippet roasBadge({ roas }: { roas: number })}
	{@const roasValue = roas ?? 0}
	{@const variant = roasValue >= 100 ? 'default' : 'destructive'}
	<Badge {variant} class="tabular-nums">
		{roasValue.toFixed(2)}%
	</Badge>
{/snippet}

{#snippet assetTypeBadges({ types }: { types: string[] | null })}
	<div class="flex gap-1">
		{#if types && types.length > 0}
			{#each types as type (type)}
				{#if type === 'AD_TYPE_SEARCH'}
					<Badge variant="secondary">Search</Badge>
				{:else if type === 'AD_TYPE_LISTING'}
					<Badge variant="outline">Listing</Badge>
				{/if}
			{/each}
		{:else}
			<span class="text-muted-foreground">-</span>
		{/if}
	</div>
{/snippet}

{#snippet productsLink({ campaignId, count }: { campaignId: string; count: number })}
	{#if Number(count) > 0}
		<a href="/products?campaign={encodeURIComponent(campaignId)}">
			<Badge
				variant="secondary"
				class="tabular-nums transition-colors hover:bg-primary hover:text-primary-foreground"
			>
				{count}
			</Badge>
		</a>
	{:else}
		<Badge variant="outline" class="border-transparent text-muted-foreground tabular-nums">0</Badge>
	{/if}
{/snippet}

{#snippet keywordsLink({ campaignId, count }: { campaignId: string; count: number })}
	{#if Number(count) > 0}
		<a href="/keywords?campaign={encodeURIComponent(campaignId)}">
			<Badge
				variant="secondary"
				class="tabular-nums transition-colors hover:bg-primary hover:text-primary-foreground"
			>
				{count}
			</Badge>
		</a>
	{:else}
		<span class="text-muted-foreground">-</span>
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
							<Breadcrumb.Page>Campaigns</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
		</header>
		<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
			<!-- Campaigns Table -->
			<div class="space-y-2">
				<h2 class="text-2xl font-semibold tracking-tight">Campaign Performance Metrics</h2>
				<p class="text-sm text-muted-foreground">
					{#if data.keywordFilter}
						Showing campaigns for keyword "{data.keywordFilter}". Click column headers to sort.
					{:else if data.productName}
						Showing campaigns for product "{data.productName}". Click column headers to sort.
					{:else}
						Campaign-level analytics including ROAS, product count, and performance data. Click
						column headers to sort.
					{/if}
				</p>
				{#if data.keywordFilter || data.productName}
					<div class="flex items-center gap-2">
						{#if data.keywordFilter}
							<Badge variant="secondary" class="gap-1">
								Keyword: {data.keywordFilter}
								<a href="/campaigns" class="ml-1 rounded-full hover:bg-muted-foreground/20">
									<XIcon class="size-3" />
								</a>
							</Badge>
						{/if}
						{#if data.productName}
							<Badge variant="secondary" class="gap-1">
								Product: {data.productName}
								<a href="/campaigns" class="ml-1 rounded-full hover:bg-muted-foreground/20">
									<XIcon class="size-3" />
								</a>
							</Badge>
						{/if}
					</div>
				{/if}
			</div>
			<div class="flex items-center gap-2">
				<div class="relative max-w-sm flex-1">
					<SearchIcon
						class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						type="text"
						placeholder="Search campaigns..."
						class="pl-9"
						value={searchValue}
						oninput={(e) => {
							searchValue = e.currentTarget.value;
							table.getColumn('campaignName')?.setFilterValue(searchValue);
						}}
					/>
				</div>
				<select
					class="h-9 rounded-md border border-input bg-background px-3 text-sm"
					value={categoryFilter}
					onchange={(e) => {
						categoryFilter = e.currentTarget.value;
						table.getColumn('topCategory')?.setFilterValue(categoryFilter || undefined);
					}}
				>
					<option value="">All Categories</option>
					{#each categories as cat}
						<option value={cat}>{cat}</option>
					{/each}
				</select>
				<Popover.Root>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" class="h-9 gap-2 text-sm font-normal" {...props}>
								<CalendarIcon class="size-4" />
								{dateRangeLabel()}
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-auto p-0" align="start">
						<RangeCalendar bind:value={dateRange} numberOfMonths={2} />
						{#if dateRange.start || dateRange.end}
							<div class="border-t p-2">
								<Button
									variant="ghost"
									size="sm"
									class="w-full"
									onclick={() => {
										dateRange = { start: undefined, end: undefined };
									}}
								>
									Clear dates
								</Button>
							</div>
						{/if}
					</Popover.Content>
				</Popover.Root>
			</div>
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
										<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
									</Table.Cell>
								{/each}
							</Table.Row>
						{:else}
							<Table.Row>
								<Table.Cell colspan={columns.length} class="h-24 text-center">
									No campaigns found.
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
			<div class="flex items-center justify-between px-2">
				<div class="flex items-center gap-4 text-sm text-muted-foreground">
					<span>
						Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
							1}
						to {Math.min(
							(table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
							table.getFilteredRowModel().rows.length
						)}
						of {table.getFilteredRowModel().rows.length} campaigns
					</span>
					<select
						class="h-8 rounded-md border border-input bg-background px-2 text-sm"
						value={table.getState().pagination.pageSize}
						onchange={(e) => table.setPageSize(Number(e.currentTarget.value))}
					>
						{#each [25, 50, 75, 100] as size}
							<option value={size}>{size} per page</option>
						{/each}
						<option value={table.getFilteredRowModel().rows.length}>All</option>
					</select>
				</div>
				<div class="flex items-center space-x-2">
					<Button
						variant="outline"
						size="sm"
						onclick={() => table.setPageIndex(0)}
						disabled={!table.getCanPreviousPage()}
					>
						<ChevronsLeftIcon class="size-4" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onclick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						<ChevronLeftIcon class="size-4" />
					</Button>
					<span class="text-sm">
						Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
					</span>
					<Button
						variant="outline"
						size="sm"
						onclick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						<ChevronRightIcon class="size-4" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onclick={() => table.setPageIndex(table.getPageCount() - 1)}
						disabled={!table.getCanNextPage()}
					>
						<ChevronsRightIcon class="size-4" />
					</Button>
				</div>
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
