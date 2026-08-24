<script lang="ts">
	import UserAvatar from '$lib/components/user-avatar.svelte';
	import {
		buildPayrollEmployeePhotoDisplayUrl,
		getPayrollEmployeeInitials
	} from '$lib/shared/payroll/employee-photo';

	let {
		firstName,
		lastName,
		photoUrl = null,
		updatedAt = null,
		class: className = 'size-8'
	}: {
		firstName: string;
		lastName: string;
		photoUrl?: string | null;
		updatedAt?: string | Date | number | null;
		class?: string;
	} = $props();

	const avatarUrl = $derived(
		buildPayrollEmployeePhotoDisplayUrl({
			photoUrl,
			updatedAt
		})
	);
	const initials = $derived(getPayrollEmployeeInitials(firstName, lastName));
</script>

<UserAvatar avatarUrl={avatarUrl} initials={initials} class={className} />
