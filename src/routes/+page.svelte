<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	let { data } = $props();
	let loading = $state(false);
</script>

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

<main class="flex min-h-svh w-full flex-col items-center justify-center gap-4 bg-gray-900 text-white">
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
			<button
				type="submit"
				class="cursor-pointer bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50"
				disabled={loading}
			>
				Logout
			</button>
		</form>
	{:else}
		<a
			href={resolve('/auth/login')}
			class="cursor-pointer bg-amber-200 px-4 py-2 text-black hover:bg-amber-300"
		>
			Login
		</a>
	{/if}
</main>
