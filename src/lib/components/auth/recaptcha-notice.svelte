<script lang="ts">
	import { isRecaptchaClientEnabled } from '$lib/recaptcha/client';
</script>

{#if isRecaptchaClientEnabled()}
	<p class="text-muted-foreground text-left text-[0.65rem] leading-relaxed">
		This site is protected by reCAPTCHA and the Google
		<a
			href="https://policies.google.com/privacy"
			class="hover:text-foreground underline"
			target="_blank"
			rel="noopener noreferrer"
		>
			Privacy Policy
		</a>
		and
		<a
			href="https://policies.google.com/terms"
			class="hover:text-foreground underline"
			target="_blank"
			rel="noopener noreferrer"
		>
			Terms of Service
		</a>
		apply.
	</p>
{/if}
