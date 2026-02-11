<script lang="ts">
	import { enhance } from '$app/forms';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { FieldGroup, Field, FieldLabel } from '$lib/components/ui/field/index.js';
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
	import ChevronsLeftIcon from '@lucide/svelte/icons/chevrons-left';
	import ChevronsRightIcon from '@lucide/svelte/icons/chevrons-right';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import XIcon from '@lucide/svelte/icons/x';

	let { data, form } = $props();

	type User = {
		id: string;
		name: string;
		email: string;
		role: string | null;
		createdAt: Date;
		banned: boolean | null;
	};

	let sorting = $state<SortingState>([]);
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 25 });
	let showCreateForm = $state(false);
	let loading = $state(false);
	let editingUser = $state<User | null>(null);

	const columns: ColumnDef<User>[] = [
		{
			accessorKey: 'name',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Name' }),
			cell: ({ row }) => row.getValue('name') ?? 'N/A'
		},
		{
			accessorKey: 'email',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Email' }),
			cell: ({ row }) => row.getValue('email') ?? 'N/A'
		},
		{
			accessorKey: 'role',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Role' }),
			cell: ({ row }) => {
				const role = row.getValue('role') as string | null;
				return renderSnippet(roleBadge, { role });
			}
		},
		{
			accessorKey: 'createdAt',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Created' }),
			cell: ({ row }) => {
				const date = row.getValue('createdAt') as Date;
				return date ? new Date(date).toLocaleDateString() : 'N/A';
			}
		},
		{
			accessorKey: 'banned',
			header: ({ column }) => renderSnippet(sortableHeader, { column, label: 'Status' }),
			cell: ({ row }) => {
				const banned = row.getValue('banned') as boolean | null;
				return renderSnippet(statusBadge, { banned });
			}
		},
		{
			id: 'actions',
			header: () => 'Actions',
			cell: ({ row }) => renderSnippet(actionsCell, { user: row.original })
		}
	];

	const table = createSvelteTable({
		get data() {
			return data.users as User[];
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

{#snippet sortableHeader({ column, label }: { column: Column<User, unknown>; label: string })}
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

{#snippet roleBadge({ role }: { role: string | null })}
	{#if role === 'admin'}
		<Badge variant="default">admin</Badge>
	{:else}
		<Badge variant="secondary">{role ?? 'user'}</Badge>
	{/if}
{/snippet}

{#snippet statusBadge({ banned }: { banned: boolean | null })}
	{#if banned}
		<Badge variant="destructive">Banned</Badge>
	{:else}
		<Badge variant="outline">Active</Badge>
	{/if}
{/snippet}

{#snippet actionsCell({ user: u }: { user: User })}
	<Button
		variant="ghost"
		size="sm"
		onclick={() => {
			editingUser = { ...u };
			showCreateForm = false;
		}}
	>
		<PencilIcon class="size-4" />
	</Button>
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
							<Breadcrumb.Page>Users</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
		</header>
		<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
			<!-- Header with Create Button -->
			<div class="flex items-center justify-between">
				<div class="space-y-1">
					<h2 class="text-2xl font-semibold tracking-tight">All Users</h2>
					<p class="text-sm text-muted-foreground">
						Manage users and their roles. Click column headers to sort.
					</p>
				</div>
				<Button onclick={() => (showCreateForm = !showCreateForm)}>
					<PlusIcon class="mr-2 size-4" />
					{showCreateForm ? 'Cancel' : 'Create User'}
				</Button>
			</div>

			<!-- Create User Form -->
			{#if showCreateForm}
				<Card.Root>
					<Card.Header>
						<Card.Title>New User</Card.Title>
						<Card.Description>Add a new user to the system</Card.Description>
					</Card.Header>
					<Card.Content>
						<form
							method="POST"
							action="?/create"
							use:enhance={() => {
								loading = true;
								return async ({ update }) => {
									loading = false;
									await update();
								};
							}}
						>
							<FieldGroup>
								<Field>
									<FieldLabel for="name">Name</FieldLabel>
									<Input
										id="name"
										name="name"
										type="text"
										placeholder="John Doe"
										value={form?.name ?? ''}
										required
									/>
								</Field>
								<Field>
									<FieldLabel for="email">Email</FieldLabel>
									<Input
										id="email"
										name="email"
										type="email"
										placeholder="john@example.com"
										value={form?.email ?? ''}
										required
									/>
								</Field>
								<Field>
									<FieldLabel for="password">Password</FieldLabel>
									<Input id="password" name="password" type="password" required />
								</Field>
								<Field>
									<FieldLabel for="role">Role</FieldLabel>
									<select
										id="role"
										name="role"
										class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
										value={form?.role ?? 'user'}
									>
										<option value="user">User</option>
										<option value="admin">Admin</option>
									</select>
								</Field>
								{#if form?.error}
									<p class="text-sm text-destructive">{form.error}</p>
								{/if}
								{#if form?.success}
									<p class="text-sm text-green-600">User created successfully!</p>
								{/if}
								<Field>
									<Button type="submit" class="w-full" disabled={loading}>
										<PlusIcon class="mr-2 size-4" />
										{loading ? 'Creating...' : 'Create User'}
									</Button>
								</Field>
							</FieldGroup>
						</form>
					</Card.Content>
				</Card.Root>
			{/if}

			<!-- Edit User Form -->
			{#if editingUser}
				<Card.Root>
					<Card.Header>
						<div class="flex items-center justify-between">
							<div>
								<Card.Title>Edit User</Card.Title>
								<Card.Description>Update {editingUser.name}'s details</Card.Description>
							</div>
							<Button variant="ghost" size="sm" onclick={() => (editingUser = null)}>
								<XIcon class="size-4" />
							</Button>
						</div>
					</Card.Header>
					<Card.Content>
						<form
							method="POST"
							action="?/update"
							use:enhance={() => {
								loading = true;
								return async ({ update }) => {
									loading = false;
									editingUser = null;
									await update();
								};
							}}
						>
							<input type="hidden" name="id" value={editingUser.id} />
							<FieldGroup>
								<Field>
									<FieldLabel for="edit-name">Name</FieldLabel>
									<Input
										id="edit-name"
										name="name"
										type="text"
										value={editingUser.name}
										required
									/>
								</Field>
								<Field>
									<FieldLabel for="edit-email">Email</FieldLabel>
									<Input
										id="edit-email"
										name="email"
										type="email"
										value={editingUser.email}
										required
									/>
								</Field>
								<Field>
									<FieldLabel for="edit-password">New Password</FieldLabel>
									<Input
										id="edit-password"
										name="password"
										type="password"
										placeholder="Leave blank to keep current"
									/>
								</Field>
								<Field>
									<FieldLabel for="edit-role">Role</FieldLabel>
									<select
										id="edit-role"
										name="role"
										class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
										value={editingUser.role ?? 'user'}
									>
										<option value="user">User</option>
										<option value="admin">Admin</option>
									</select>
								</Field>
								<Field>
									<FieldLabel for="edit-banned">Status</FieldLabel>
									<select
										id="edit-banned"
										name="banned"
										class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
										value={editingUser.banned ? 'true' : 'false'}
									>
										<option value="false">Active</option>
										<option value="true">Banned</option>
									</select>
								</Field>
								{#if form?.editError}
									<p class="text-sm text-destructive">{form.editError}</p>
								{/if}
								{#if form?.editSuccess}
									<p class="text-sm text-green-600">User updated successfully!</p>
								{/if}
								<Field>
									<Button type="submit" class="w-full" disabled={loading}>
										{loading ? 'Saving...' : 'Save Changes'}
									</Button>
								</Field>
							</FieldGroup>
						</form>
					</Card.Content>
				</Card.Root>
			{/if}
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
									No users found.
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
			<div class="flex items-center justify-between px-2">
				<div class="text-sm text-muted-foreground">
					Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
					to {Math.min(
						(table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
						table.getRowCount()
					)}
					of {table.getRowCount()} users
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
