<script lang="ts">
	import { buildMailboxEmailSrcdoc } from '$lib/mailbox/utils';

	let { html }: { html: string } = $props();

	let iframeEl = $state<HTMLIFrameElement | null>(null);
	let iframeHeight = $state(320);

	const srcdoc = $derived(buildMailboxEmailSrcdoc(html));

	function resizeIframe() {
		const body = iframeEl?.contentDocument?.body;
		if (!body) {
			return;
		}

		iframeHeight = Math.max(body.scrollHeight, 120);
	}

	$effect(() => {
		html;

		const frame = iframeEl;
		if (!frame) {
			return;
		}

		resizeIframe();

		const doc = frame.contentDocument;
		if (!doc?.body) {
			return;
		}

		const observer = new ResizeObserver(() => {
			resizeIframe();
		});

		observer.observe(doc.body);

		return () => {
			observer.disconnect();
		};
	});
</script>

<iframe
	bind:this={iframeEl}
	title="Email message body"
	class="w-full border-0"
	{srcdoc}
	sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
	onload={resizeIframe}
	style:height="{iframeHeight}px"
></iframe>
