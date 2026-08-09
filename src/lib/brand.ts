import {
	PUBLIC_BRAND_PRIMARY,
	PUBLIC_BRAND_SECONDARY,
	PUBLIC_BRAND_TERTIARY
} from '$env/static/public';
import {
	createBrandTheme,
	DEFAULT_BRAND_PRIMARY,
	DEFAULT_BRAND_SECONDARY,
	DEFAULT_BRAND_TERTIARY,
	resolveBrandColor
} from '$lib/shared/brand-colors';

export const brandTheme = createBrandTheme({
	primary: resolveBrandColor(PUBLIC_BRAND_PRIMARY, DEFAULT_BRAND_PRIMARY),
	secondary: resolveBrandColor(PUBLIC_BRAND_SECONDARY, DEFAULT_BRAND_SECONDARY),
	tertiary: resolveBrandColor(PUBLIC_BRAND_TERTIARY, DEFAULT_BRAND_TERTIARY)
});
