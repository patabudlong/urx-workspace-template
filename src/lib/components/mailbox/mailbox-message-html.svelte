<script lang="ts">
	import { buildMailboxEmailSrcdoc } from '$lib/mailbox/utils';

	let { html }: { html: string } = $props();

	let iframeEl = $state<HTMLIFrameElement | null>(null);
	let iframeHeight = $state(1);
	let resizeObserver: ResizeObserver | null = null;

	const srcdoc = $derived(buildMailboxEmailSrcdoc(html));

	function measureIframeHeight(): number {
		const doc = iframeEl?.contentDocument;
		if (!doc?.body) {
			return 1;
		}

		const body = doc.body;
		const root = doc.documentElement;

		return Math.max(
			Math.ceil(body.getBoundingClientRect().height),
			body.scrollHeight,
			body.offsetHeight,
			root.scrollHeight,
			root.offsetHeight,
			1
		);
	}

	function resizeIframe() {
		const nextHeight = measureIframeHeight();
		if (nextHeight !== iframeHeight) {
			iframeHeight = nextHeight;
		}
	}

	function observeIframeContent() {
		resizeObserver?.disconnect();
		resizeObserver = null;

		const doc = iframeEl?.contentDocument;
		if (!doc?.body) {
			return;
		}

		resizeObserver = new ResizeObserver(() => {
			resizeIframe();
		});
		resizeObserver.observe(doc.body);

		for (const image of doc.images) {
			if (!image.complete) {
				image.addEventListener('load', resizeIframe, { once: true });
			}
		}
	}

	function handleLoad() {
		resizeIframe();
		requestAnimationFrame(() => {
			resizeIframe();
			observeIframeContent();
		});
	}

	$effect(() => {
		html;
		iframeHeight = 1;

		return () => {
			resizeObserver?.disconnect();
			resizeObserver = null;
		};
	});
</script>

<iframe
	bind:this={iframeEl}
	title="Email message body"
	class="bg-background block w-full overflow-hidden rounded-lg border shadow-sm"
	{srcdoc}
	sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
	scrolling="no"
	onload={handleLoad}
	style:height="{iframeHeight}px"
></iframe>
