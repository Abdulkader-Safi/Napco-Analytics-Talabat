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
	import SearchIcon from '@lucide/svelte/icons/search';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import ChevronsLeftIcon from '@lucide/svelte/icons/chevrons-left';
	import ChevronsRightIcon from '@lucide/svelte/icons/chevrons-right';
	import XIcon from '@lucide/svelte/icons/x';

	let { data } = $props();

	type Keyword = {
		keyword: string | null;
		currency: string | null;
		impressions: number;
		totalClicks: number;
		ctr: number;
		totalRevenue: number;
		productsCount: number;
		campaignsCount: number;
		avgCpc: number;
		avgRoas: number;
	};

	let sorting = $state<SortingState>([]);
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 25 });
	let columnFilters = $state<ColumnFiltersState>([]);
	let searchValue = $state('');

	const columns: ColumnDef<Keyword>[] = [
		{
			accessorKey: 'keyword',
			header: ({ column }) => {
				return renderSnippet(sortableHeader, { column, label: 'Keyword' });
			},
			cell: ({ row }) => row.getValue('keyword') ?? 'N/A'
		},
		{
			accessorKey: 'avgRoas',
			header: ({ column }) => {
				return renderSnippet(sortableHeader, { column, label: 'ROAS' });
			},
			cell: ({ row }) => {
				const roas = row.getValue('avgRoas') as number;
				return renderSnippet(roasBadge, { roas });
			}
		},
		{
			accessorKey: 'impressions',
			header: ({ column }) => {
				return renderSnippet(sortableHeader, { column, label: 'Impressions' });
			},
			cell: ({ row }) => {
				const value = row.getValue('impressions') as number;
				return (value ?? 0).toLocaleString();
			}
		},
		{
			accessorKey: 'totalClicks',
			header: ({ column }) => {
				return renderSnippet(sortableHeader, { column, label: 'Total Clicks' });
			},
			cell: ({ row }) => {
				const value = row.getValue('totalClicks') as number;
				return (value ?? 0).toLocaleString();
			}
		},
		{
			accessorKey: 'ctr',
			header: ({ column }) => {
				return renderSnippet(sortableHeader, { column, label: 'CTR %' });
			},
			cell: ({ row }) => {
				const ctr = row.getValue('ctr') as number;
				return renderSnippet(ctrBadge, { ctr });
			}
		},
		{
			accessorKey: 'totalRevenue',
			header: ({ column }) => {
				return renderSnippet(sortableHeader, { column, label: 'Total Revenue' });
			},
			cell: ({ row }) => {
				const revenue = row.getValue('totalRevenue') as number;
				const currency = row.original.currency ?? 'KWD';
				return `${(revenue ?? 0).toFixed(2)} ${currency}`;
			}
		},
		{
			accessorKey: 'productsCount',
			header: ({ column }) => {
				return renderSnippet(sortableHeader, { column, label: 'Products' });
			},
			cell: ({ row }) => {
				const keyword = row.original.keyword ?? '';
				const count = row.getValue('productsCount') as number;
				return renderSnippet(productsLink, { keyword, count });
			}
		},
		{
			accessorKey: 'campaignsCount',
			header: ({ column }) => {
				return renderSnippet(sortableHeader, { column, label: 'Campaigns' });
			},
			cell: ({ row }) => {
				const keyword = row.original.keyword ?? '';
				const count = row.getValue('campaignsCount') as number;
				return renderSnippet(campaignsLink, { keyword, count });
			}
		},
		{
			accessorKey: 'avgCpc',
			header: ({ column }) => {
				return renderSnippet(sortableHeader, { column, label: 'Avg CPC' });
			},
			cell: ({ row }) => {
				const cpc = row.getValue('avgCpc') as number;
				const currency = row.original.currency ?? 'KWD';
				return `${(cpc ?? 0).toFixed(2)} ${currency}`;
			}
		}
	];

	const table = createSvelteTable({
		get data() {
			return data.keywords as Keyword[];
		},
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: (updater) => {
			if (typeof updater === 'function') {
				sorting = updater(sorting);
			} else {
				sorting = updater;
			}
		},
		onPaginationChange: (updater) => {
			if (typeof updater === 'function') {
				pagination = updater(pagination);
			} else {
				pagination = updater;
			}
		},
		onColumnFiltersChange: (updater) => {
			if (typeof updater === 'function') {
				columnFilters = updater(columnFilters);
			} else {
				columnFilters = updater;
			}
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

{#snippet sortableHeader({ column, label }: { column: Column<Keyword, unknown>; label: string })}
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

{#snippet ctrBadge({ ctr }: { ctr: number })}
	{@const ctrValue = ctr ?? 0}
	{@const variant = ctrValue >= 2 ? 'default' : 'destructive'}
	<Badge {variant} class="tabular-nums">
		{ctrValue.toFixed(2)}%
	</Badge>
{/snippet}

{#snippet roasBadge({ roas }: { roas: number })}
	{@const roasValue = roas ?? 0}
	{@const variant = roasValue >= 100 ? 'default' : 'destructive'}
	<Badge {variant} class="tabular-nums">
		{roasValue.toFixed(2)}%
	</Badge>
{/snippet}

{#snippet productsLink({ keyword, count }: { keyword: string; count: number })}
	{#if Number(count) > 0}
		<a href="/products?keyword={encodeURIComponent(keyword)}">
			<Badge variant="secondary" class="tabular-nums hover:bg-primary hover:text-primary-foreground transition-colors">
				{count}
			</Badge>
		</a>
	{:else}
		<Badge variant="outline" class="tabular-nums border-transparent text-muted-foreground">0</Badge>
	{/if}
{/snippet}

{#snippet campaignsLink({ keyword, count }: { keyword: string; count: number })}
	{#if Number(count) > 0}
		<a href="/campaigns?keyword={encodeURIComponent(keyword)}">
			<Badge variant="secondary" class="tabular-nums hover:bg-primary hover:text-primary-foreground transition-colors">
				{count}
			</Badge>
		</a>
	{:else}
		<Badge variant="outline" class="tabular-nums border-transparent text-muted-foreground">0</Badge>
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
							<Breadcrumb.Page>Keywords</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
		</header>
		<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
			<div class="space-y-2">
				<h2 class="text-2xl font-semibold tracking-tight">Keyword Performance</h2>
				<p class="text-sm text-muted-foreground">
					{#if data.campaignFilter}
						Showing keywords for campaign "{data.campaignFilter}". Click column headers to sort.
					{:else}
						Keyword-level analytics including impressions, clicks, CTR, revenue, and CPC. Click column
						headers to sort.
					{/if}
				</p>
				{#if data.campaignFilter}
					<div class="flex items-center gap-2">
						<Badge variant="secondary" class="gap-1">
							Campaign: {data.campaignFilter}
							<a href="/keywords" class="ml-1 rounded-full hover:bg-muted-foreground/20">
								<XIcon class="size-3" />
							</a>
						</Badge>
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
						placeholder="Search keywords..."
						class="pl-9"
						value={searchValue}
						oninput={(e) => {
							searchValue = e.currentTarget.value;
							table.getColumn('keyword')?.setFilterValue(searchValue);
						}}
					/>
				</div>
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
									No keywords found.
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
			<div class="flex items-center justify-between px-2">
				<div class="flex items-center gap-4 text-sm text-muted-foreground">
					<span>
						Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
						to {Math.min(
							(table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
							table.getFilteredRowModel().rows.length
						)}
						of {table.getFilteredRowModel().rows.length} keywords
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
