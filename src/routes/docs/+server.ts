import { ScalarApiReference } from '@scalar/sveltekit';
import type { RequestHandler } from './$types';

const renderDocs = ScalarApiReference({
	url: '/api/v1/openapi.json',
	theme: 'default',
	pageTitle: 'API Reference · Urixoft Workspace',
	favicon: '/favicon.png'
});

export const GET: RequestHandler = () => {
	return renderDocs();
};
