import {
	WORKSPACE_LOGO_CROP_OUTPUT_SIZE,
	WORKSPACE_LOGO_CROP_VIEWPORT_SIZE
} from '$lib/shared/workspace-branding';

export type ImageCropTransform = {
	scale: number;
	offsetX: number;
	offsetY: number;
};

export function createDefaultCropTransform(): ImageCropTransform {
	return { scale: 1, offsetX: 0, offsetY: 0 };
}

export function getCropBaseScale(
	imageWidth: number,
	imageHeight: number,
	viewportSize = WORKSPACE_LOGO_CROP_VIEWPORT_SIZE
): number {
	return Math.max(viewportSize / imageWidth, viewportSize / imageHeight);
}

export async function loadImageElement(file: File): Promise<HTMLImageElement> {
	const url = URL.createObjectURL(file);

	try {
		const image = new Image();
		image.decoding = 'async';

		await new Promise<void>((resolve, reject) => {
			image.onload = () => resolve();
			image.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'));
			image.src = url;
		});

		return image;
	} catch (error) {
		URL.revokeObjectURL(url);
		throw error;
	}
}

export async function cropImageToSquareFile(
	image: HTMLImageElement,
	transform: ImageCropTransform,
	options?: {
		viewportSize?: number;
		outputSize?: number;
		fileName?: string;
	}
): Promise<File> {
	const viewportSize = options?.viewportSize ?? WORKSPACE_LOGO_CROP_VIEWPORT_SIZE;
	const outputSize = options?.outputSize ?? WORKSPACE_LOGO_CROP_OUTPUT_SIZE;
	const baseScale = getCropBaseScale(image.naturalWidth, image.naturalHeight, viewportSize);
	const displayScale = baseScale * transform.scale;
	const displayWidth = image.naturalWidth * displayScale;
	const displayHeight = image.naturalHeight * displayScale;
	const left = (viewportSize - displayWidth) / 2 + transform.offsetX;
	const top = (viewportSize - displayHeight) / 2 + transform.offsetY;
	const sourceX = (0 - left) / displayScale;
	const sourceY = (0 - top) / displayScale;
	const sourceSize = viewportSize / displayScale;

	const canvas = document.createElement('canvas');
	canvas.width = outputSize;
	canvas.height = outputSize;

	const context = canvas.getContext('2d');

	if (!context) {
		throw new Error('CROP_CANVAS_UNAVAILABLE');
	}

	context.clearRect(0, 0, outputSize, outputSize);
	context.drawImage(
		image,
		sourceX,
		sourceY,
		sourceSize,
		sourceSize,
		0,
		0,
		outputSize,
		outputSize
	);

	const blob = await new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(result) => {
				if (result) {
					resolve(result);
					return;
				}

				reject(new Error('CROP_EXPORT_FAILED'));
			},
			'image/png',
			0.92
		);
	});

	return new File([blob], options?.fileName ?? 'workspace-logo.png', { type: 'image/png' });
}
