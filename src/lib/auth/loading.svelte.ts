const SPINNER_DELAY_MS = 180;

export function createAuthLoadingState() {
	let authBusy = $state(false);
	let showSpinner = $state(false);
	let spinnerTimer: ReturnType<typeof setTimeout> | null = null;

	function clearSpinnerTimer() {
		if (spinnerTimer !== null) {
			clearTimeout(spinnerTimer);
			spinnerTimer = null;
		}
	}

	return {
		/** True as soon as a valid submit starts — disables fields / blocks double submit. */
		get authBusy() {
			return authBusy;
		},
		/** Spinner only after a short delay so fast logins never flash loading UI. */
		get isAuthLoading() {
			return showSpinner;
		},
		setAuthBusy(busy: boolean) {
			clearSpinnerTimer();

			if (busy) {
				authBusy = true;
				spinnerTimer = setTimeout(() => {
					if (authBusy) {
						showSpinner = true;
					}
				}, SPINNER_DELAY_MS);
				return;
			}

			authBusy = false;
			showSpinner = false;
		},
		reset() {
			clearSpinnerTimer();
			authBusy = false;
			showSpinner = false;
		}
	};
}

export type AuthLoadingState = ReturnType<typeof createAuthLoadingState>;
