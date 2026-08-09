import { MediaQuery } from "svelte/reactivity";

/** Matches Tailwind `lg` (1024px). Sidebars collapse to drawer / horizontal nav below this width. */
export const MOBILE_BREAKPOINT = 1024;

export class IsMobile extends MediaQuery {
	constructor(breakpoint: number = MOBILE_BREAKPOINT) {
		super(`max-width: ${breakpoint - 1}px`);
	}
}
