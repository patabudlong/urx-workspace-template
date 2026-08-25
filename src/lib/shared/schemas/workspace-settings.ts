import { z } from 'zod';

export const updateWorkspaceNameSchema = z.object({
	name: z
		.string()
		.trim()
		.min(2, 'Workspace name must be at least 2 characters.')
		.max(120, 'Workspace name must be at most 120 characters.')
});

export type UpdateWorkspaceNameInput = z.infer<typeof updateWorkspaceNameSchema>;
