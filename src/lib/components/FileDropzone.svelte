<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		files: File[];
		title?: string;
		description?: string;
		disabled?: boolean;
		iconColor?: string;
	}

	let {
		files = $bindable([]),
		title = 'Upload Files',
		description = 'Drag & drop Excel files (.xlsx) to upload',
		disabled = false,
		iconColor = 'text-muted-foreground'
	}: Props = $props();

	let isDragging = $state(false);
	let fileInput: HTMLInputElement;

	function handleFiles(fileList: FileList | null) {
		if (!fileList || disabled) return;

		const newFiles: File[] = [];
		for (const file of fileList) {
			// Only accept xlsx files
			if (
				file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
				file.name.endsWith('.xlsx')
			) {
				newFiles.push(file);
			}
		}

		files = [...files, ...newFiles];
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		handleFiles(event.dataTransfer?.files ?? null);
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (!disabled) {
			isDragging = true;
		}
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
	}

	function handleClick() {
		if (!disabled) {
			fileInput?.click();
		}
	}

	function handleInputChange(event: Event) {
		const input = event.target as HTMLInputElement;
		handleFiles(input.files);
		input.value = ''; // Reset to allow selecting same file again
	}

	function removeFile(index: number) {
		files = files.filter((_, i) => i !== index);
	}

	function clearFiles() {
		files = [];
	}
</script>

<Card.Root class="w-full">
	<Card.Header>
		<Card.Title>{title}</Card.Title>
		<Card.Description>{description}</Card.Description>
	</Card.Header>
	<Card.Content>
		<input
			bind:this={fileInput}
			type="file"
			accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
			multiple
			class="hidden"
			onchange={handleInputChange}
			{disabled}
		/>

		<!-- Drop Zone -->
		<button
			type="button"
			class="flex min-h-50 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors {isDragging
				? 'border-primary bg-primary/10'
				: 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'} {disabled
				? 'cursor-not-allowed opacity-50'
				: ''}"
			ondrop={handleDrop}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			onclick={handleClick}
			{disabled}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="mb-2 h-8 w-8 {iconColor}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
				/>
			</svg>
			<p class="mb-1 text-sm text-muted-foreground">
				<span class="font-semibold">Click to upload</span> or drag and drop
			</p>
			<p class="text-xs text-muted-foreground">Excel files (.xlsx) only</p>
		</button>

		<!-- File List -->
		{#if files.length > 0}
			<div class="mt-3 space-y-2">
				<div class="flex items-center justify-between">
					<h4 class="text-sm font-medium">Selected ({files.length})</h4>
					<Button
						variant="ghost"
						size="sm"
						onclick={clearFiles}
						{disabled}
						class="h-7 px-2 text-xs"
					>
						Clear
					</Button>
				</div>
				<ul class="space-y-1">
					{#each files as file, index (file.name + index)}
						<li class="flex items-center justify-between rounded border bg-muted/30 px-2 py-1.5">
							<div class="flex items-center gap-2 overflow-hidden">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 shrink-0 text-green-500"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
								<span class="truncate text-sm">{file.name}</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onclick={() => removeFile(index)}
								{disabled}
								class="h-6 w-6 shrink-0 p-0"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-3 w-3"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</Button>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
