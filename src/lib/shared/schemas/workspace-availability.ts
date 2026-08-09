import { z } from 'zod';
import { isValidWorkspaceSlug, slugifyWorkspaceName } from '$lib/shared/workspace-slug';

export const workspaceAvailabilityQuerySchema = z
	.object({
		name: z.string().trim().optional(),
		slug: z.string().trim().optional()
	})
	.refine((value) => Boolean(value.name || value.slug), {
		message: 'Provide a workspace name and/or slug to check.'
	});

export type WorkspaceAvailabilityQuery = z.infer<typeof workspaceAvailabilityQuerySchema>;

export type WorkspaceFieldAvailability = {
	available: boolean;
};

export type WorkspaceAvailabilityResult = {
	name?: WorkspaceFieldAvailability;
	slug?: WorkspaceFieldAvailability;
};

export function isWorkspaceNameReadyForAvailabilityCheck(name: string): boolean {
	return name.trim().length >= 2;
}

export function isWorkspaceSlugReadyForAvailabilityCheck(slug: string): boolean {
	return isValidWorkspaceSlug(slugifyWorkspaceName(slug));
}
