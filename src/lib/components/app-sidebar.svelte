<script lang="ts">
	import NavMain from './nav-main.svelte';
	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { resolve as resolvePath } from '$app/paths';
	import type { ComponentProps } from 'svelte';

	import UploadIcon from '@lucide/svelte/icons/upload';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import UsersIcon from '@lucide/svelte/icons/users';

	interface Props extends ComponentProps<typeof Sidebar.Root> {
		user: {
			name: string;
			email: string;
			image: string | null;
			role: string;
		} | null;
	}

	let { ref = $bindable(null), user, ...restProps }: Props = $props();

	const navMain = $derived([
		{
			title: 'Dashboard',
			url: '/',
			icon: LayoutDashboardIcon,
			isActive: true,
			items: [
				{
					title: 'Campaigns',
					url: '/campaigns'
				},
				{
					title: 'Keywords',
					url: '/keywords'
				},
				{
					title: 'Products',
					url: '/products'
				}
			]
		},
		{
			title: 'Forecast',
			url: '/forecast',
			icon: TrendingUpIcon
		},
		{
			title: 'Upload Data',
			url: '/upload',
			icon: UploadIcon
		},
		...(user?.role === 'admin'
			? [
					{
						title: 'Users',
						url: '/users',
						icon: UsersIcon
					}
				]
			: [])
	]);
</script>

<Sidebar.Root bind:ref variant="floating" collapsible="icon" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<a href={resolvePath('/')} {...props}>
							<img src="/logo.png" alt="Napco National" class="w-full object-contain" />
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={navMain} />
	</Sidebar.Content>
	<Sidebar.Footer>
		{#if user}
			<NavUser {user} />
		{/if}
	</Sidebar.Footer>
</Sidebar.Root>
