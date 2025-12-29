<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta name="description" content="Napco Analytics Dashboard" />
	<meta name="keywords" content="analytics, dashboard, napco" />
	<meta name="author" content="Abdulkader Safi" />
	<title>Napco Analytics Dashboard</title>
	<meta name="robots" content="index, follow" />
</svelte:head>
{@render children()}
