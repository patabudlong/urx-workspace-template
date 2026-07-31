class ActionProgressState {
	count = $state(0);

	get active(): boolean {
		return this.count > 0;
	}

	start(): void {
		this.count += 1;
	}

	stop(): void {
		this.count = Math.max(0, this.count - 1);
	}

	async run<T>(fn: () => Promise<T>): Promise<T> {
		this.start();

		try {
			return await fn();
		} finally {
			this.stop();
		}
	}
}

export const actionProgress = new ActionProgressState();
