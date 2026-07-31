import { ScalarApiReference } from '@scalar/sveltekit';
import type { RequestHandler } from './$types';

const renderDocs = ScalarApiReference({
	url: '/api/v1/openapi.json',
	theme: 'default',
	pageTitle: 'URX API Reference',
	favicon: '/favicon.png'
});

export const GET: RequestHandler = () => {
	return renderDocs();
};
