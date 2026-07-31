<script lang="ts">
	import {
		getPasswordChecks,
		getPasswordStrength,
		PASSWORD_HISTORY_LIMIT,
		type PasswordStrengthLevel
	} from '$lib/shared/password-policy';
	import { cn } from '$lib/utils.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import CircleIcon from '@lucide/svelte/icons/circle';

	let { password = '', showReuseHint = false }: { password?: string; showReuseHint?: boolean } =
		$props();

	const checks = $derived(getPasswordChecks(password));
	const strength = $derived(getPasswordStrength(password));

	const strengthBarClass: Record<Exclude<PasswordStrengthLevel, 'empty'>, string> = {
		weak: 'bg-destructive',
		fair: 'bg-amber-500',
		good: 'bg-primary',
		strong: 'bg-emerald-600'
	};

	const strengthTextClass: Record<Exclude<PasswordStrengthLevel, 'empty'>, string> = {
		weak: 'text-destructive',
		fair: 'text-amber-600 dark:text-amber-400',
		good: 'text-primary',
		strong: 'text-emerald-600 dark:text-emerald-400'
	};
</script>

<div class="space-y-3 rounded-lg border bg-muted/30 p-3">
	<div class="space-y-2">
		<div class="flex items-center justify-between gap-2">
			<p class="text-muted-foreground text-xs font-medium">Password strength</p>
			{#if strength.label && strength.level !== 'empty'}
				<p class={cn('text-xs font-medium', strengthTextClass[strength.level])}>
					{strength.label}
				</p>
			{/if}
		</div>
		<div class="flex gap-1" aria-hidden="true">
			{#each [1, 2, 3, 4] as segment}
				<div
					class={cn(
						'h-1 flex-1 rounded-full transition-colors',
						strength.score >= segment && strength.level !== 'empty'
							? strengthBarClass[strength.level]
							: 'bg-muted'
					)}
				></div>
			{/each}
		</div>
	</div>

	<div class="space-y-1.5">
		<p class="text-muted-foreground text-xs font-medium">Your password must include:</p>
		<ul class="space-y-1.5" aria-live="polite">
			{#each checks as check (check.id)}
				<li class="flex items-start gap-2 text-xs">
					{#if check.passed}
						<CheckIcon class="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
						<span class="text-foreground">{check.label}</span>
					{:else}
						<CircleIcon class="text-muted-foreground/50 mt-0.5 size-3.5 shrink-0" />
						<span class="text-muted-foreground">{check.label}</span>
					{/if}
				</li>
			{/each}
		</ul>
		{#if showReuseHint}
			<p class="text-muted-foreground text-xs">
				Cannot match your current password or any of your last {PASSWORD_HISTORY_LIMIT} passwords.
			</p>
		{/if}
	</div>
</div>
