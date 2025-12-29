<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';

	import Input from '$lib/components/ui/input/input.svelte';

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

<main class="flex min-h-svh w-full flex-col items-center justify-center">
	<Card.Root class="mx-auto w-full max-w-3xl">
		<Card.Header>
			<Card.Title class="text-2xl">Signup</Card.Title>
			<!-- <Card.Description>Enter your email below to login to your account</Card.Description> -->
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				class="flex w-full flex-col gap-4"
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
						<Input
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
						<Input
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
						<Input
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
						<Input
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

				<Button
					type="submit"
					class="w-full cursor-pointer bg-amber-200 p-1 text-center text-black hover:text-white disabled:opacity-50"
					disabled={loading}
				>
					{loading ? 'Signing up...' : 'Signup'}
				</Button>
			</form>
		</Card.Content>
		<Card.Footer>
			<p class="text-sm">
				Don't have an account?
				<Button variant="link" href={resolve('/auth/login')} class="underline">Login</Button>
			</p>
		</Card.Footer>
	</Card.Root>
</main>
