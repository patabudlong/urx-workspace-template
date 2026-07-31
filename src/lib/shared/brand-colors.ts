import { z } from 'zod';

/** Urixoft logo blue — dominant color sampled from `urixoft-logo.png`. */
export const DEFAULT_BRAND_PRIMARY = '#0471B7';

/** Mid-tone blue — lighter ribbon accent derived from the logo palette. */
export const DEFAULT_BRAND_SECONDARY = '#2A93CF';

/** Soft blue tint — highlight / fold tones from the logo for low-emphasis UI. */
export const DEFAULT_BRAND_TERTIARY = '#C8E6F7';

const hexColorSchema = z
	.string()
	.regex(/^#[0-9A-Fa-f]{6}$/, 'Expected a 6-digit hex color (e.g. #0471B7)');

export const brandColorsSchema = z.object({
	primary: hexColorSchema,
	secondary: hexColorSchema,
	tertiary: hexColorSchema
});

export type BrandColors = z.infer<typeof brandColorsSchema>;

export function resolveBrandColor(value: string | undefined, fallback: string): string {
	if (!value) return fallback;
	const parsed = hexColorSchema.safeParse(value.trim());
	return parsed.success ? parsed.data : fallback;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const normalized = hex.replace('#', '');
	return {
		r: Number.parseInt(normalized.slice(0, 2), 16),
		g: Number.parseInt(normalized.slice(2, 4), 16),
		b: Number.parseInt(normalized.slice(4, 6), 16)
	};
}

function channelToLinear(channel: number): number {
	const value = channel / 255;
	return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
	const { r, g, b } = hexToRgb(hex);
	return (
		0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b)
	);
}

/** Pick readable text on top of a brand swatch. */
export function contrastingForeground(hex: string): '#FFFFFF' | '#0A1F33' {
	return relativeLuminance(hex) > 0.55 ? '#0A1F33' : '#FFFFFF';
}

export type BrandTheme = BrandColors & {
	primaryForeground: string;
	secondaryForeground: string;
	tertiaryForeground: string;
};

export function createBrandTheme(colors: BrandColors): BrandTheme {
	return {
		...colors,
		primaryForeground: contrastingForeground(colors.primary),
		secondaryForeground: contrastingForeground(colors.secondary),
		tertiaryForeground: contrastingForeground(colors.tertiary)
	};
}
