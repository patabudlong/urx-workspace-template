<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import {
		PHONE_COUNTRY_CODES,
		countryFlag,
		dialCodeForIso,
		formatContactPhone,
		parseContactPhone
	} from '$lib/shared/phone-country-codes';

	let {
		value = $bindable(''),
		id,
		name,
		class: className,
		disabled = false,
		'aria-invalid': ariaInvalid,
		'aria-describedby': ariaDescribedby
	}: {
		value?: string;
		id?: string;
		name?: string;
		class?: string;
		disabled?: boolean;
		'aria-invalid'?: boolean | 'true' | 'false';
		'aria-describedby'?: string;
	} = $props();

	const initial = parseContactPhone(value);
	let selectedIso = $state(initial.iso);
	let nationalNumber = $state(initial.national);

	$effect(() => {
		value = formatContactPhone(selectedIso, nationalNumber);
	});

	const selectedPhoneCountry = $derived(
		PHONE_COUNTRY_CODES.find((entry) => entry.iso === selectedIso) ?? PHONE_COUNTRY_CODES[0]
	);
</script>

<InputGroup.Root class={className}>
	<InputGroup.Addon align="inline-start" class="!ml-0 shrink-0 border-input border-r px-1 py-0">
		<Select.Root type="single" bind:value={selectedIso} {disabled}>
			<Select.Trigger
				id={`${id ?? 'contact-phone'}-country`}
				class="h-7 w-auto gap-1 border-0 bg-transparent px-1.5 shadow-none focus-visible:ring-0 data-[size=default]:h-7"
				aria-label="Country calling code"
			>
				<span class="flex items-center gap-1">
					<span aria-hidden="true">{countryFlag(selectedPhoneCountry.iso)}</span>
					<span class="text-foreground text-sm tabular-nums">
						{dialCodeForIso(selectedPhoneCountry.iso)}
					</span>
				</span>
			</Select.Trigger>
			<Select.Content class="max-h-72">
				<Select.Group>
					{#each PHONE_COUNTRY_CODES as entry (entry.iso)}
						<Select.Item value={entry.iso} label={`${entry.name} ${entry.dialCode}`}>
							<span class="flex items-center gap-2">
								<span aria-hidden="true">{countryFlag(entry.iso)}</span>
								<span class="truncate">{entry.name}</span>
								<span class="text-muted-foreground tabular-nums">{entry.dialCode}</span>
							</span>
						</Select.Item>
					{/each}
				</Select.Group>
			</Select.Content>
		</Select.Root>
	</InputGroup.Addon>

	<InputGroup.Input
		{id}
		type="tel"
		inputmode="tel"
		autocomplete="tel-national"
		{disabled}
		aria-invalid={ariaInvalid}
		aria-describedby={ariaDescribedby}
		bind:value={nationalNumber}
		class="pl-2"
	/>
	<input type="hidden" {name} {value} />
</InputGroup.Root>
