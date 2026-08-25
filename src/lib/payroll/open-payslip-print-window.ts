import {
	buildPayslipPrintDocumentHtml,
	type PayslipPrintDocumentInput
} from '$lib/shared/payroll/payslip-print';

function waitForImages(doc: Document): Promise<void> {
	const images = Array.from(doc.images);

	if (images.length === 0) {
		return Promise.resolve();
	}

	return Promise.all(
		images.map(
			(image) =>
				new Promise<void>((resolve) => {
					if (image.complete) {
						resolve();
						return;
					}

					image.addEventListener('load', () => resolve(), { once: true });
					image.addEventListener('error', () => resolve(), { once: true });
				})
		)
	).then(() => undefined);
}

export function openPayslipPrintWindow(input: PayslipPrintDocumentInput): boolean {
	if (typeof window === 'undefined' || typeof document === 'undefined') {
		return false;
	}

	const html = buildPayslipPrintDocumentHtml(input);
	const iframe = document.createElement('iframe');
	iframe.setAttribute('title', 'Payslip print');
	iframe.setAttribute('aria-hidden', 'true');
	iframe.style.cssText =
		'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';

	document.body.appendChild(iframe);

	const frameWindow = iframe.contentWindow;
	const frameDocument = frameWindow?.document;

	if (!frameWindow || !frameDocument) {
		iframe.remove();
		return false;
	}

	frameDocument.open();
	frameDocument.write(html);
	frameDocument.close();

	const cleanup = () => {
		iframe.remove();
	};

	const triggerPrint = async () => {
		try {
			await waitForImages(frameDocument);
			frameWindow.focus();
			frameWindow.print();
		} finally {
			frameWindow.addEventListener('afterprint', cleanup, { once: true });
			window.setTimeout(cleanup, 60_000);
		}
	};

	if (frameDocument.readyState === 'complete') {
		void triggerPrint();
	} else {
		iframe.addEventListener('load', () => {
			void triggerPrint();
		}, { once: true });
	}

	return true;
}
