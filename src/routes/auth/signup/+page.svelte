<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	let { form } = $props();
	let loading = $state(false);
</script>

{#if loading}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="flex flex-col items-center gap-4">
			<div
				class="h-12 w-12 animate-spin rounded-full border-4 border-amber-200 border-t-transparent"
			></div>
			<p class="text-white">Signing up...</p>
		</div>
	</div>
{/if}

<main class="flex min-h-svh w-full flex-col items-center justify-center bg-gray-900 text-white">
	<div class="flex flex-col items-center justify-center gap-4 bg-gray-800 p-10">
		<h1 class="text-3xl font-bold">Signup</h1>
		<form
			method="POST"
			class="flex flex-col gap-4"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
		>
			<div class="flex flex-row gap-4">
				<label for="username" class="grid w-full grid-cols-3 items-center gap-1.5">
					Username:
					<input
						type="text"
						id="username"
						name="username"
						value={form?.username ?? ''}
						class="col-span-2 bg-white p-1 text-black"
						required
					/>
				</label>
			</div>

			<div class="flex flex-row gap-4">
				<label for="email" class="grid w-full grid-cols-3 items-center gap-1.5">
					Email:
					<input
						type="email"
						id="email"
						name="email"
						value={form?.email ?? ''}
						class="col-span-2 bg-white p-1 text-black"
						required
					/>
				</label>
			</div>

			<div class="flex flex-row gap-4">
				<label for="password" class="grid w-full grid-cols-3 items-center gap-1.5">
					Password:
					<input
						type="password"
						id="password"
						name="password"
						class="col-span-2 bg-white p-1 text-black"
						required
					/>
				</label>
			</div>

			<div class="flex flex-row gap-4">
				<label for="confirm_password" class="grid w-full grid-cols-3 items-center gap-1.5">
					Confirm Password:
					<input
						type="password"
						id="confirm_password"
						name="confirm_password"
						class="col-span-2 bg-white p-1 text-black"
						required
					/>
				</label>
			</div>

			{#if form?.error}
				<p class="text-red-500">{form.error}</p>
			{/if}

			<button
				type="submit"
				class="w-full cursor-pointer bg-amber-200 p-1 text-center text-black disabled:opacity-50"
				disabled={loading}
			>
				{loading ? 'Signing up...' : 'Signup'}
			</button>
		</form>
		<p class="text-sm">
			Already have an account?
			<a href={resolve('/auth/login')} class="text-amber-200 underline">Login</a>
		</p>
	</div>
</main>
