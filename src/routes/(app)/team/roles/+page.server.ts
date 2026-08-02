import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace } = await parent();

	if (!workspace) {
		redirect(303, '/');
	}

	return {
		meta: {
			title: 'Roles & permissions'
		}
	};
};
