/** Full-width actions on auth screens — submit, OAuth, and navigation buttons. */
export const AUTH_ACTION_BUTTON_CLASS = 'h-10 w-full';

/** Form controls on auth screens — matches button height. */
export const AUTH_FIELD_CONTROL_CLASS = 'h-10';

/** Compact OAuth button — side-by-side social sign-in row (ShadcnSpace auth1 style). */
export const AUTH_OAUTH_COMPACT_CLASS =
	'h-10 w-full gap-2 border-border text-muted-foreground shadow-xs hover:bg-accent hover:text-accent-foreground';

/** Inline link inside auth footer copy (e.g. "Sign in", "Sign up"). */
export const AUTH_INLINE_LINK_CLASS = 'gradient-link text-sm font-medium';

/** Inline text button matching auth link styling (e.g. "Use a backup code"). */
export const AUTH_INLINE_BUTTON_LINK_CLASS =
	'gradient-link cursor-pointer border-0 bg-transparent p-0 text-sm font-medium';
