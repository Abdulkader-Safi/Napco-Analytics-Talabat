<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';

	interface UploadResult {
		success: boolean;
		stats?: {
			totalFiles: number;
			reportsInserted: number;
			selloutInserted: number;
			errors: string[];
		};
		error?: string;
	}

	interface Props {
		isUploading?: boolean;
		progress?: number;
		currentFile?: string;
		totalFiles?: number;
		currentFileIndex?: number;
		result?: UploadResult | null;
		type?: 'reports' | 'sellout' | 'both';
	}

	let {
		isUploading = false,
		progress = 0,
		currentFile = '',
		totalFiles = 0,
		currentFileIndex = 0,
		result = null,
		type = 'both'
	}: Props = $props();
</script>

{#if isUploading}
	<Card.Root class="w-full">
		<Card.Header>
			<Card.Title>Uploading...</Card.Title>
			<Card.Description>
				Processing file {currentFileIndex + 1} of {totalFiles}
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-3">
			<Progress value={progress} max={100} class="w-full" />
			<p class="truncate text-sm text-muted-foreground">
				{currentFile}
			</p>
		</Card.Content>
	</Card.Root>
{/if}

{#if result}
	{#if result.success && result.stats}
		<Card.Root class="w-full border-green-500/50">
			<Card.Header class="pb-2">
				<Card.Title class="text-green-500">Upload Complete!</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if type === 'both'}
					<div class="grid grid-cols-2 gap-3">
						<div class="rounded-lg border bg-muted/30 p-3">
							<div class="flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 text-blue-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									/>
								</svg>
								<span class="text-sm font-medium">Reports</span>
							</div>
							<p class="mt-1 text-xl font-bold">
								{result.stats.reportsInserted.toLocaleString()}
							</p>
							<p class="text-xs text-muted-foreground">records</p>
						</div>

						<div class="rounded-lg border bg-muted/30 p-3">
							<div class="flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 text-green-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
									/>
								</svg>
								<span class="text-sm font-medium">Sellout</span>
							</div>
							<p class="mt-1 text-xl font-bold">
								{result.stats.selloutInserted.toLocaleString()}
							</p>
							<p class="text-xs text-muted-foreground">records</p>
						</div>
					</div>
				{:else if type === 'reports'}
					<div class="rounded-lg border bg-muted/30 p-3">
						<div class="flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4 text-blue-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								/>
							</svg>
							<span class="text-sm font-medium">Reports Inserted</span>
						</div>
						<p class="mt-1 text-xl font-bold">
							{result.stats.reportsInserted.toLocaleString()}
						</p>
					</div>
				{:else if type === 'sellout'}
					<div class="rounded-lg border bg-muted/30 p-3">
						<div class="flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4 text-green-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
							<span class="text-sm font-medium">Sellout Inserted</span>
						</div>
						<p class="mt-1 text-xl font-bold">
							{result.stats.selloutInserted.toLocaleString()}
						</p>
					</div>
				{/if}

				{#if result.stats.errors.length > 0}
					<div class="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
						<p class="mb-1 text-sm font-medium text-yellow-500">Warnings</p>
						<ul class="space-y-0.5">
							{#each result.stats.errors as error (error)}
								<li class="text-xs text-yellow-400">{error}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	{:else if result.error}
		<Card.Root class="w-full border-red-500/50">
			<Card.Header class="pb-2">
				<Card.Title class="text-red-500">Upload Failed</Card.Title>
			</Card.Header>
			<Card.Content>
				<p class="text-sm text-red-400">{result.error}</p>
			</Card.Content>
		</Card.Root>
	{/if}
{/if}
