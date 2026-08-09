<script lang="ts">
	import { buildMailboxEmailSrcdoc } from '$lib/mailbox/utils';

	let { html }: { html: string } = $props();

	let iframeEl = $state<HTMLIFrameElement | null>(null);
	let iframeHeight = $state(240);

	const srcdoc = $derived(buildMailboxEmailSrcdoc(html));

	function resizeIframe() {
		const body = iframeEl?.contentDocument?.body;
		if (!body) {
			return;
		}

		const nextHeight = Math.max(body.scrollHeight, 240);
		if (nextHeight !== iframeHeight) {
			iframeHeight = nextHeight;
		}
	}

	function handleLoad() {
		resizeIframe();
		requestAnimationFrame(resizeIframe);
	}
</script>

<iframe
	bind:this={iframeEl}
	title="Email message body"
	class="bg-background w-full rounded-lg border shadow-sm"
	{srcdoc}
	sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
	onload={handleLoad}
	style:height="{iframeHeight}px"
></iframe>
