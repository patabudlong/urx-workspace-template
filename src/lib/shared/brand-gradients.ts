export type BrandGradientTone = 'primary' | 'secondary' | 'destructive' | 'warning';

export type BrandGradientDirection = 'horizontal' | 'vertical';

export const BRAND_GRADIENT_STOPS: Record<
	BrandGradientTone,
	{ from: string; to: string }
> = {
	primary: {
		from: 'var(--gradient-primary-from)',
		to: 'var(--gradient-primary-to)'
	},
	secondary: {
		from: 'var(--gradient-secondary-from)',
		to: 'var(--gradient-secondary-to)'
	},
	destructive: {
		from: 'var(--gradient-destructive-from)',
		to: 'var(--gradient-destructive-to)'
	},
	warning: {
		from: 'var(--gradient-warning-from)',
		to: 'var(--gradient-warning-to)'
	}
};

const GRADIENT_ANGLE: Record<BrandGradientDirection, string> = {
	horizontal: '90deg',
	vertical: '180deg'
};

export function brandGradientImage(
	tone: BrandGradientTone,
	direction: BrandGradientDirection = 'horizontal'
): string {
	const { from, to } = BRAND_GRADIENT_STOPS[tone];
	return `linear-gradient(${GRADIENT_ANGLE[direction]}, ${from}, ${to})`;
}

export function getHttpErrorGradientTone(status: number): BrandGradientTone {
	if (status >= 500) {
		return 'destructive';
	}

	if (status === 403) {
		return 'warning';
	}

	if (status === 404) {
		return 'primary';
	}

	return 'secondary';
}

export function gradientButtonClasses(
	tone: BrandGradientTone,
	variant: 'filled' | 'outline' = 'filled'
): string {
	if (variant === 'outline') {
		return `gradient-button-outline gradient-button-outline-${tone}`;
	}

	return `gradient-button gradient-button-${tone}`;
}
