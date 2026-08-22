import type { RequestHandler } from './$types';
import { findWorkspaceBySlug } from '$lib/server/repositories/workspaces';
import { loadWorkspaceBrandLogoAsset } from '$lib/server/workspace-brand-logo';

export const GET: RequestHandler = async ({ params }) => {
	const slug = params.slug?.trim().toLowerCase();

	if (!slug) {
		return new Response(null, { status: 404 });
	}

	const workspace = await findWorkspaceBySlug(slug);

	if (!workspace?.brandLogoUrl?.trim()) {
		return new Response(null, { status: 404 });
	}

	const asset = await loadWorkspaceBrandLogoAsset(slug);

	if (!asset) {
		return new Response(null, { status: 404 });
	}

	return new Response(new Uint8Array(asset.body), {
		headers: {
			'Content-Type': asset.contentType,
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
