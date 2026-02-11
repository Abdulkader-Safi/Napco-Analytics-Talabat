<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { FieldGroup, Field, FieldLabel } from '$lib/components/ui/field/index.js';

	let { form } = $props();
	let loading = $state(false);
</script>

{#if loading}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="flex flex-col items-center gap-4">
			<div
				class="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
			<p class="text-white">Logging in...</p>
		</div>
	</div>
{/if}

<div class="flex h-screen w-full items-center justify-center px-4">
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header class="flex w-full flex-col items-center justify-center">
			<img src="/logo.png" alt="Napco National" class="mb-2 h-12 object-contain" />
			<Card.Description class="w-full text-start">
				Enter your email below to login to your account
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
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
						<FieldLabel for="email">Email</FieldLabel>
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="m@example.com"
							value={form?.email ?? ''}
							required
						/>
					</Field>
					<Field>
						<FieldLabel for="password">Password</FieldLabel>
						<Input id="password" name="password" type="password" required />
					</Field>
					{#if form?.error}
						<p class="text-sm text-destructive">{form.error}</p>
					{/if}
					<Field>
						<Button type="submit" class="w-full" disabled={loading}>
							{loading ? 'Logging in...' : 'Login'}
						</Button>
					</Field>
				</FieldGroup>
			</form>
		</Card.Content>
		<Card.Footer class="justify-center">
			<span class="flex items-center gap-1 text-xs text-muted-foreground">
				Powered by
				<a href="https://dsrpt.com.au" target="_blank" rel="noopener noreferrer">
					<img
						src="https://cdn.statically.io/gh/Abdulkader-Safi-GoGoogle/dsrpt_images/main/DSRPT_BLACK.png"
						alt="DSRPT"
						class="inline-block w-10"
					/>
				</a>
			</span>
		</Card.Footer>
	</Card.Root>
</div>
