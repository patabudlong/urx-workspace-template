export class DtrDayLockedError extends Error {
	readonly code = 'LOCKED' as const;

	constructor() {
		super('DTR day is locked');
		this.name = 'DtrDayLockedError';
	}
}

export function isDtrDayLockedError(error: unknown): boolean {
	return error instanceof DtrDayLockedError;
}
