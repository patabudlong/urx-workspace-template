/** Stub for unused optional sveltekit-superforms peer — keeps Vine out of the Vite client graph. */
export class Vine {
	validate(): never {
		throw new Error('@vinejs/vine is unused in this app; use Zod adapters');
	}
}

export const errors = { E_VALIDATION_ERROR: Error };
