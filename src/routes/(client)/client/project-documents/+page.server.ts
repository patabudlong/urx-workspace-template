import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getPmDocumentPortalPreview,
	listPmDocumentFilesForChecklistItem,
	submitPmDocumentUpload
} from '$lib/server/project-management/document-portal';
import {
	PM_DOCUMENT_UPLOAD_FAILED_MESSAGE,
	PM_DOCUMENT_UPLOAD_INVALID_LINK_MESSAGE,
	PM_DOCUMENT_UPLOAD_INVALID_TYPE_MESSAGE,
	PM_DOCUMENT_UPLOAD_STORAGE_NOT_CONFIGURED_MESSAGE,
	PM_DOCUMENT_UPLOAD_SUBMITTED_MESSAGE,
	PM_DOCUMENT_UPLOAD_TOO_LARGE_MESSAGE
} from '$lib/shared/project-management/messages';

export const load: PageServerLoad = async ({ url }) => {
	const token = (url.searchParams.get('token') ?? '').trim();
	const preview = token ? await getPmDocumentPortalPreview(token) : null;

	return {
		token,
		preview,
		meta: {
			title: 'Project documents'
		}
	};
};

export const actions: Actions = {
	upload: async ({ request, url }) => {
		const token = (url.searchParams.get('token') ?? '').trim();

		if (!token) {
			return fail(400, { message: PM_DOCUMENT_UPLOAD_INVALID_LINK_MESSAGE });
		}

		const formData = await request.formData();
		const checklistItemId = String(formData.get('checklistItemId') ?? '').trim();
		const fileEntry = formData.get('file');
		const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;

		if (!checklistItemId || !file) {
			return fail(400, { message: PM_DOCUMENT_UPLOAD_FAILED_MESSAGE });
		}

		const result = await submitPmDocumentUpload({ token, checklistItemId, file });

		if (!result.ok) {
			const messageText =
				result.reason === 'INVALID_TOKEN'
					? PM_DOCUMENT_UPLOAD_INVALID_LINK_MESSAGE
					: result.reason === 'INVALID_TYPE'
						? PM_DOCUMENT_UPLOAD_INVALID_TYPE_MESSAGE
						: result.reason === 'FILE_TOO_LARGE'
							? PM_DOCUMENT_UPLOAD_TOO_LARGE_MESSAGE
							: result.reason === 'STORAGE_NOT_CONFIGURED'
								? PM_DOCUMENT_UPLOAD_STORAGE_NOT_CONFIGURED_MESSAGE
								: PM_DOCUMENT_UPLOAD_FAILED_MESSAGE;

			return fail(400, { message: messageText });
		}

		return { message: PM_DOCUMENT_UPLOAD_SUBMITTED_MESSAGE };
	}
};
