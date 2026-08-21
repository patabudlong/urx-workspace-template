<script lang="ts">
	import AuthWorkspaceHeadline from '$lib/components/auth/auth-workspace-headline.svelte';
	import UrixoftLogo from '$lib/components/urixoft-logo.svelte';
</script>

<section
	class="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-3xl bg-[linear-gradient(155deg,color-mix(in_srgb,var(--primary)_32%,var(--brand-deep))_0%,color-mix(in_srgb,var(--primary)_55%,var(--brand-deep))_38%,var(--primary)_68%,color-mix(in_srgb,var(--secondary)_88%,var(--primary))_100%)] p-8 xl:p-10"
>
	<div
		class="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_bottom_left,color-mix(in_srgb,var(--primary)_70%,var(--brand-deep)),transparent_62%)]"
	></div>
	<div
		class="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_52%)]"
	></div>
	<div
		class="pointer-events-none absolute inset-0 rounded-3xl opacity-[0.06] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:3rem_3rem]"
	></div>

	<UrixoftLogo
		variant="white"
		alt=""
		class="pointer-events-none absolute top-[68%] -left-20 size-[26rem] -translate-y-1/2 opacity-[0.12] select-none xl:top-[74%] xl:size-[32rem]"
	/>

	<div class="relative z-10 flex flex-1 flex-col items-start justify-start px-2 pt-40 text-left xl:pt-58">
		<AuthWorkspaceHeadline />
		<p class="text-primary-foreground/80 mt-5 max-w-md text-base leading-relaxed xl:mt-6 xl:text-lg">
			Manage Jobs, Clients, and your Team in one place.
		</p>
	</div>
</section>
