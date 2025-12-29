<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import Button from '$lib/components/ui/button/button.svelte';

	let { data } = $props();
	let loading = $state(false);
</script>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<header class="flex h-16 shrink-0 items-center gap-2">
			<div class="flex items-center gap-2 px-4">
				<Sidebar.Trigger class="-ms-1" />
				<Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item class="hidden md:block">
							<Breadcrumb.Link href="##">Building Your Application</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator class="hidden md:block" />
						<Breadcrumb.Item>
							<Breadcrumb.Page>Data Fetching</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
		</header>
		<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
			{#if loading}
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div class="flex flex-col items-center gap-4">
						<div
							class="h-12 w-12 animate-spin rounded-full border-4 border-amber-200 border-t-transparent"
						></div>
						<p class="text-white">Logging out...</p>
					</div>
				</div>
			{/if}
			<div class="grid auto-rows-min gap-4 md:grid-cols-3">
				<div class="aspect-video rounded-xl bg-muted/50"></div>
				<div class="aspect-video rounded-xl bg-muted/50"></div>
				<div class="aspect-video rounded-xl bg-muted/50"></div>
			</div>
			<div
				class="flex min-h-screen flex-1 flex-col items-center justify-center gap-2.5 rounded-xl bg-muted/50 md:min-h-min"
			>
				<h1 class="text-3xl font-bold">Welcome {data.name}</h1>

				{#if data.name !== 'Guest'}
					<form
						method="POST"
						action="?/logout"
						use:enhance={() => {
							loading = true;
							return async ({ update }) => {
								loading = false;
								await update();
							};
						}}
					>
						<Button type="submit" variant="destructive" disabled={loading}>Logout</Button>
					</form>
				{:else}
					<Button
						href={resolve('/auth/login')}
						class="cursor-pointer bg-amber-200 px-4 py-2 text-black hover:bg-amber-300"
					>
						Login
					</Button>
				{/if}
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
