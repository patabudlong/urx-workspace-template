export type SuperformDialogResetTarget = {
	reset: (options?: { keepMessage?: boolean }) => void;
	errors: { clear: () => void };
};

/** Clears superform field values, validation errors, and action messages. */
export function resetSuperformDialogState(target: SuperformDialogResetTarget) {
	target.reset();
	target.errors.clear();
}

/** Run cleanup when a dialog closes (`open` becomes false). */
export function whenDialogCloses(open: boolean, onClose: () => void) {
	if (!open) {
		onClose();
	}
}
