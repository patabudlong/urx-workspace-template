<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import BoldIcon from '@lucide/svelte/icons/bold';
	import ItalicIcon from '@lucide/svelte/icons/italic';
	import LinkIcon from '@lucide/svelte/icons/link';
	import ListIcon from '@lucide/svelte/icons/list';
	import ListOrderedIcon from '@lucide/svelte/icons/list-ordered';
	import UnderlineIcon from '@lucide/svelte/icons/underline';

	let {
		id,
		value = $bindable(''),
		class: className,
		disabled = false,
		'aria-label': ariaLabel = 'Message'
	}: {
		id: string;
		value?: string;
		class?: string;
		disabled?: boolean;
		'aria-label'?: string;
	} = $props();

	let editor = $state<HTMLDivElement | null>(null);

	function syncValue() {
		if (!editor) {
			return;
		}

		value = editor.innerHTML;
	}

	function runCommand(command: string, argument?: string) {
		if (!editor || disabled) {
			return;
		}

		editor.focus();
		document.execCommand(command, false, argument);
		syncValue();
	}

	function handleLink() {
		const selection = window.getSelection()?.toString().trim();
		if (!selection) {
			return;
		}

		const url = window.prompt('Enter link URL');
		if (!url?.trim()) {
			return;
		}

		runCommand('createLink', url.trim());
	}

	$effect(() => {
		const next = value;
		if (!editor || editor.innerHTML === next) {
			return;
		}

		editor.innerHTML = next;
	});
</script>

<div class={cn('border-input bg-background overflow-hidden rounded-md border shadow-xs', className)}>
	<div
		class="border-border bg-muted/30 flex flex-wrap items-center gap-0.5 border-b px-1 py-1"
		role="toolbar"
		aria-label="Message formatting"
	>
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			aria-label="Bold"
			disabled={disabled}
			onclick={() => runCommand('bold')}
		>
			<BoldIcon aria-hidden="true" />
		</Button>
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			aria-label="Italic"
			disabled={disabled}
			onclick={() => runCommand('italic')}
		>
			<ItalicIcon aria-hidden="true" />
		</Button>
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			aria-label="Underline"
			disabled={disabled}
			onclick={() => runCommand('underline')}
		>
			<UnderlineIcon aria-hidden="true" />
		</Button>
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			aria-label="Bulleted list"
			disabled={disabled}
			onclick={() => runCommand('insertUnorderedList')}
		>
			<ListIcon aria-hidden="true" />
		</Button>
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			aria-label="Numbered list"
			disabled={disabled}
			onclick={() => runCommand('insertOrderedList')}
		>
			<ListOrderedIcon aria-hidden="true" />
		</Button>
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			aria-label="Insert link"
			disabled={disabled}
			onclick={handleLink}
		>
			<LinkIcon aria-hidden="true" />
		</Button>
	</div>

	<div
		bind:this={editor}
		{id}
		contenteditable={disabled ? 'false' : 'true'}
		role="textbox"
		aria-multiline="true"
		aria-label={ariaLabel}
		class="text-foreground min-h-32 px-3 py-2 text-sm leading-relaxed outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] [&_a]:text-primary [&_a]:underline [&_b]:font-semibold [&_i]:italic [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:ps-6 [&_strong]:font-semibold [&_u]:underline [&_ul]:my-2 [&_ul]:list-disc [&_ul]:ps-6"
		oninput={syncValue}
		onblur={syncValue}
	></div>
</div>
