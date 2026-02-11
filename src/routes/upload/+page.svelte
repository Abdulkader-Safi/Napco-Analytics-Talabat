<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import FileDropzone from '$lib/components/FileDropzone.svelte';
	import UploadProgress from '$lib/components/UploadProgress.svelte';

	let { data } = $props();

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

	// Reports state
	let reportFiles = $state<File[]>([]);
	let isUploadingReports = $state(false);
	let reportsProgress = $state(0);
	let reportsCurrentFile = $state('');
	let reportsCurrentIndex = $state(0);
	let reportsResult = $state<UploadResult | null>(null);

	// Sellout state
	let selloutFiles = $state<File[]>([]);
	let isUploadingSellout = $state(false);
	let selloutProgress = $state(0);
	let selloutCurrentFile = $state('');
	let selloutCurrentIndex = $state(0);
	let selloutResult = $state<UploadResult | null>(null);

	// Clear state
	let isClearing = $state(false);
	let clearDialogOpen = $state(false);
	let clearType = $state<'reports' | 'sellout' | 'all'>('all');
	let clearResult = $state<{
		success: boolean;
		deleted?: { reports: number; sellout: number; total: number };
		error?: string;
	} | null>(null);

	async function uploadFiles(
		files: File[],
		type: 'report' | 'sellout',
		setProgress: (p: number) => void,
		setCurrentFile: (f: string) => void,
		setCurrentIndex: (i: number) => void
	): Promise<UploadResult> {
		const formData = new FormData();
		for (const file of files) {
			formData.append('files', file);
		}

		// Simulate progress
		for (let i = 0; i < files.length; i++) {
			setCurrentIndex(i);
			setCurrentFile(files[i].name);
			setProgress(Math.round(((i + 0.5) / files.length) * 100));
			await new Promise((resolve) => setTimeout(resolve, 50));
		}

		const response = await fetch(`/api/upload?type=${type}`, {
			method: 'POST',
			body: formData
		});

		const result = await response.json();

		if (!response.ok) {
			return { success: false, error: result.message || 'Upload failed' };
		}

		return { success: true, stats: result.stats };
	}

	async function handleUploadReports() {
		if (reportFiles.length === 0) return;

		isUploadingReports = true;
		reportsProgress = 0;
		reportsResult = null;

		try {
			reportsResult = await uploadFiles(
				reportFiles,
				'report',
				(p) => (reportsProgress = p),
				(f) => (reportsCurrentFile = f),
				(i) => (reportsCurrentIndex = i)
			);
			if (reportsResult.success) {
				reportFiles = [];
			}
		} catch (error) {
			reportsResult = {
				success: false,
				error: error instanceof Error ? error.message : 'Upload failed'
			};
		} finally {
			isUploadingReports = false;
			reportsProgress = 100;
		}
	}

	async function handleUploadSellout() {
		if (selloutFiles.length === 0) return;

		isUploadingSellout = true;
		selloutProgress = 0;
		selloutResult = null;

		try {
			selloutResult = await uploadFiles(
				selloutFiles,
				'sellout',
				(p) => (selloutProgress = p),
				(f) => (selloutCurrentFile = f),
				(i) => (selloutCurrentIndex = i)
			);
			if (selloutResult.success) {
				selloutFiles = [];
			}
		} catch (error) {
			selloutResult = {
				success: false,
				error: error instanceof Error ? error.message : 'Upload failed'
			};
		} finally {
			isUploadingSellout = false;
			selloutProgress = 100;
		}
	}

	async function handleClearData() {
		clearDialogOpen = false;
		isClearing = true;
		clearResult = null;

		try {
			const response = await fetch(`/api/upload?type=${clearType}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (!response.ok) {
				clearResult = { success: false, error: result.message || 'Failed to clear data' };
			} else {
				clearResult = { success: true, deleted: result.deleted };
			}
		} catch (error) {
			clearResult = {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to clear data'
			};
		} finally {
			isClearing = false;
		}
	}

	function openClearDialog(type: 'reports' | 'sellout' | 'all') {
		clearType = type;
		clearDialogOpen = true;
	}

	function resetReportsResult() {
		reportsResult = null;
	}

	function resetSelloutResult() {
		selloutResult = null;
	}
</script>

<svelte:head>
	<title>Upload Data - Napco Analytics</title>
</svelte:head>

<!-- Loading Overlay -->
{#if isUploadingReports || isUploadingSellout || isClearing}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="flex flex-col items-center gap-4">
			<div
				class="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
			<p class="text-white">
				{#if isClearing}
					Clearing data...
				{:else if isUploadingReports}
					Uploading Reports ({reportsCurrentIndex + 1}/{reportFiles.length})...
				{:else}
					Uploading Sellout ({selloutCurrentIndex + 1}/{selloutFiles.length})...
				{/if}
			</p>
		</div>
	</div>
{/if}

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
							<Breadcrumb.Page>Upload</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
		</header>
		<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
	<div class="space-y-6">
		<!-- Header -->
		<div>
			<h2 class="text-2xl font-semibold tracking-tight">Upload Data</h2>
			<p class="text-sm text-muted-foreground">Upload Excel files to import data into separate tables</p>
		</div>

		<!-- Row Counts -->
		<div class="grid gap-4 md:grid-cols-2">
			<Card.Root>
				<Card.Header class="pb-2">
					<Card.Description>Reports Rows</Card.Description>
					<Card.Title class="text-2xl tabular-nums">{data.reportsCount.toLocaleString()}</Card.Title>
				</Card.Header>
			</Card.Root>
			<Card.Root>
				<Card.Header class="pb-2">
					<Card.Description>Sellout Rows</Card.Description>
					<Card.Title class="text-2xl tabular-nums">{data.selloutCount.toLocaleString()}</Card.Title>
				</Card.Header>
			</Card.Root>
		</div>

		<!-- Clear Result Message -->
		{#if clearResult}
			{#if clearResult.success && clearResult.deleted}
				<div class="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
					<p class="text-green-500">
						Successfully cleared: {clearResult.deleted.reports.toLocaleString()} reports,
						{clearResult.deleted.sellout.toLocaleString()} sellout records
					</p>
				</div>
			{:else if clearResult.error}
				<div class="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
					<p class="text-red-500">{clearResult.error}</p>
				</div>
			{/if}
		{/if}

		<!-- Two Column Upload Sections -->
		<div class="grid gap-6 md:grid-cols-2">
			<!-- Reports Section -->
			<div class="space-y-4">
				<div class="flex items-center gap-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 text-blue-400"
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
					<h2 class="text-xl font-semibold">Reports (Ad Platform)</h2>
				</div>

				{#if reportsResult}
					<UploadProgress result={reportsResult} type="reports" />
					<Button onclick={resetReportsResult} variant="outline" class="w-full">
						Upload More Reports
					</Button>
				{:else}
					<FileDropzone
						bind:files={reportFiles}
						title="Report Files"
						description="Upload *Report*.xlsx files"
						disabled={isUploadingReports}
						iconColor="text-blue-400"
					/>

					{#if reportFiles.length > 0}
						<Button
							onclick={handleUploadReports}
							disabled={isUploadingReports}
							class="w-full bg-blue-600 hover:bg-blue-700"
						>
							Upload {reportFiles.length} Report{reportFiles.length > 1 ? 's' : ''}
						</Button>
					{/if}
				{/if}

				{#if isUploadingReports}
					<UploadProgress
						isUploading={true}
						progress={reportsProgress}
						currentFile={reportsCurrentFile}
						totalFiles={reportFiles.length}
						currentFileIndex={reportsCurrentIndex}
					/>
				{/if}
			</div>

			<!-- Sellout Section -->
			<div class="space-y-4">
				<div class="flex items-center gap-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 text-green-400"
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
					<h2 class="text-xl font-semibold">Sellout (Sales Data)</h2>
				</div>

				{#if selloutResult}
					<UploadProgress result={selloutResult} type="sellout" />
					<Button onclick={resetSelloutResult} variant="outline" class="w-full">
						Upload More Sellout
					</Button>
				{:else}
					<FileDropzone
						bind:files={selloutFiles}
						title="Sellout Files"
						description="Upload *Sellout*.xlsx files"
						disabled={isUploadingSellout}
						iconColor="text-green-400"
					/>

					{#if selloutFiles.length > 0}
						<Button
							onclick={handleUploadSellout}
							disabled={isUploadingSellout}
							class="w-full bg-green-600 hover:bg-green-700"
						>
							Upload {selloutFiles.length} Sellout File{selloutFiles.length > 1 ? 's' : ''}
						</Button>
					{/if}
				{/if}

				{#if isUploadingSellout}
					<UploadProgress
						isUploading={true}
						progress={selloutProgress}
						currentFile={selloutCurrentFile}
						totalFiles={selloutFiles.length}
						currentFileIndex={selloutCurrentIndex}
					/>
				{/if}
			</div>
		</div>

		<!-- Danger Zone -->
		<Card.Root class="border-red-500/30">
			<Card.Header>
				<Card.Title class="text-red-500">Danger Zone</Card.Title>
				<Card.Description>
					These actions will permanently delete data from the database.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="flex flex-wrap gap-3">
					<Button
						variant="outline"
						class="border-red-500/50 text-red-500 hover:bg-red-500/10"
						onclick={() => openClearDialog('reports')}
						disabled={isClearing}
					>
						Clear Reports
					</Button>
					<Button
						variant="outline"
						class="border-red-500/50 text-red-500 hover:bg-red-500/10"
						onclick={() => openClearDialog('sellout')}
						disabled={isClearing}
					>
						Clear Sellout
					</Button>
					<Button variant="destructive" onclick={() => openClearDialog('all')} disabled={isClearing}>
						Clear All Data
					</Button>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Clear Confirmation Dialog -->
		<AlertDialog.Root bind:open={clearDialogOpen}>
			<AlertDialog.Content>
				<AlertDialog.Header>
					<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
					<AlertDialog.Description>
						{#if clearType === 'all'}
							This will permanently delete ALL data from both tables.
						{:else if clearType === 'reports'}
							This will permanently delete all Report records.
						{:else}
							This will permanently delete all Sellout records.
						{/if}
						This action cannot be undone.
					</AlertDialog.Description>
				</AlertDialog.Header>
				<AlertDialog.Footer>
					<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
					<AlertDialog.Action onclick={handleClearData}>Yes, delete data</AlertDialog.Action>
				</AlertDialog.Footer>
			</AlertDialog.Content>
		</AlertDialog.Root>
	</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
