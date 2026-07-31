<script lang="ts">
	import { LEGAL_POLICY_VERSION } from '$lib/shared/legal';
</script>

<article class="space-y-8">
	<header class="space-y-2">
		<h1 class="text-3xl font-semibold tracking-tight">Privacy Notice</h1>
		<p class="text-muted-foreground text-sm">Effective date: {LEGAL_POLICY_VERSION}</p>
	</header>

	<section class="space-y-3 text-sm leading-relaxed">
		<p>
			This Privacy Notice explains how Urixoft collects, uses, stores, and secures personal
			information when you use the Workspace platform, including when you sign up with email or
			third-party identity providers.
		</p>
	</section>

	<section class="space-y-3">
		<h2 class="text-xl font-semibold tracking-tight">Information we collect</h2>
		<ul class="text-muted-foreground list-disc space-y-2 pl-5 text-sm leading-relaxed">
			<li>Account details such as name, email address, and password (stored as a secure hash).</li>
			<li>
				Consent records including the exact timestamp, IP address, and policy version when you check
				the terms agreement box or click a social sign-in button.
			</li>
			<li>Technical data such as browser user agent for fraud prevention and audit trails.</li>
		</ul>
	</section>

	<section class="space-y-3">
		<h2 class="text-xl font-semibold tracking-tight">
			Social login data (Google, Apple, and Facebook)
		</h2>
		<p class="text-muted-foreground text-sm leading-relaxed">
			When you choose <strong class="text-foreground font-medium">Continue with Google</strong>,
			<strong class="text-foreground font-medium">Sign in with Apple</strong>, or a Facebook sign-in
			option, we receive profile information from that provider's API. Depending on the provider and
			your choices, this may include your name, email address, profile picture URL, and a provider
			user identifier. We use this data only to create or authenticate your Workspace account,
			pre-fill your profile where you have granted permission, and prevent duplicate accounts and
			detect abuse.
		</p>
		<p class="text-muted-foreground text-sm leading-relaxed">
			<strong class="text-foreground font-medium">Sign in with Apple</strong> may share your name only
			on your first sign-in. You may choose to hide your email address; in that case Apple provides a
			unique private relay address that forwards to your Apple ID email. We store the email address
			(or relay address) and Apple user identifier needed to authenticate your account on future
			sign-ins.
		</p>
		<p class="text-muted-foreground text-sm leading-relaxed">
			We log the exact time and IP address when you initiate social sign-in, before redirecting to the
			provider. OAuth tokens from Google, Apple, or Facebook are used transiently to complete
			authentication and are not stored in plain text. Provider identifiers may be stored to link your
			account on future sign-ins.
		</p>
		<p class="text-muted-foreground text-sm leading-relaxed">
			Each provider's use of your data is also governed by its own privacy policy:
			<a
				href="https://policies.google.com/privacy"
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary font-medium hover:underline">Google</a
			>,
			<a
				href="https://www.apple.com/legal/privacy/"
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary font-medium hover:underline">Apple</a
			>, and
			<a
				href="https://www.facebook.com/privacy/policy/"
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary font-medium hover:underline">Facebook</a
			>.
		</p>
	</section>

	<section class="space-y-3">
		<h2 class="text-xl font-semibold tracking-tight">How we secure your data</h2>
		<ul class="text-muted-foreground list-disc space-y-2 pl-5 text-sm leading-relaxed">
			<li>Passwords are hashed with industry-standard algorithms; we never store plain-text passwords.</li>
			<li>Data in transit is protected with TLS (HTTPS).</li>
			<li>Access to production systems is restricted and audited.</li>
			<li>Consent and authentication events are retained for compliance and security investigations.</li>
		</ul>
	</section>

	<section class="space-y-3">
		<h2 class="text-xl font-semibold tracking-tight">Data retention</h2>
		<p class="text-muted-foreground text-sm leading-relaxed">
			We retain account and consent records for as long as your account is active and as required by
			law or legitimate business needs. You may request deletion of your account by contacting support.
		</p>
	</section>

	<section class="space-y-3">
		<h2 class="text-xl font-semibold tracking-tight">Third-party services</h2>
		<p class="text-muted-foreground text-sm leading-relaxed">
			We use Google reCAPTCHA to protect signup and login forms. Google's use of data is governed by
			the
			<a
				href="https://policies.google.com/privacy"
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary font-medium hover:underline">Google Privacy Policy</a
			>
			and
			<a
				href="https://policies.google.com/terms"
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary font-medium hover:underline">Terms of Service</a
			>.
		</p>
	</section>

	<section class="space-y-3">
		<h2 class="text-xl font-semibold tracking-tight">Contact</h2>
		<p class="text-muted-foreground text-sm leading-relaxed">
			Privacy questions can be sent to
			<a href="mailto:privacy@urixoft.com" class="text-primary font-medium hover:underline"
				>privacy@urixoft.com</a
			>.
		</p>
	</section>
</article>
