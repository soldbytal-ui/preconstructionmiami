import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for PreConstructionMiami.net. Learn how we collect, use, and protect your personal information.',
  alternates: {
    canonical: 'https://preconstructionmiami.net/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | PreConstructionMiami.net',
    description: 'Learn how PreConstructionMiami.net collects, uses, and protects your personal information.',
    url: 'https://preconstructionmiami.net/privacy',
    type: 'website',
  },
};

export default function PrivacyPage() {
  return (
    <div className="container-main pt-24 pb-16 max-w-4xl">
      <nav className="text-sm text-text-muted mb-8 flex items-center gap-2">
        <Link href="/" className="hover:text-accent-green transition-colors">Home</Link>
        <span className="text-text-muted/30">/</span>
        <span className="text-text-primary font-medium">Privacy Policy</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">Privacy Policy</h1>
      <p className="text-sm text-text-muted mb-10">Last updated: April 2026</p>

      <div className="space-y-8 text-text-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">1. Introduction</h2>
          <p>
            PreConstructionMiami.net (&quot;Platform,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy. This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you visit and use our website. By using the Platform, you consent to the practices described in this policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">2. Information We Collect</h2>
          <h3 className="text-lg font-medium text-text-primary mt-4 mb-2">Information You Provide</h3>
          <p className="mb-2">When you submit an inquiry form on the Platform, we collect:</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Full name</li>
            <li>Email address</li>
            <li>Phone number (optional)</li>
            <li>Message content (optional)</li>
            <li>The specific project or neighborhood you are inquiring about</li>
          </ul>

          <h3 className="text-lg font-medium text-text-primary mt-4 mb-2">Information Collected Automatically</h3>
          <p className="mb-2">When you browse the Platform, we may automatically collect:</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>IP address and approximate geographic location</li>
            <li>Browser type and version</li>
            <li>Device type and operating system</li>
            <li>Pages visited, time spent on pages, and navigation paths</li>
            <li>Referring website or search terms</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">3. How We Use Your Information</h2>
          <p className="mb-2">We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong className="text-text-primary">Connect you with licensed real estate professionals:</strong> When you submit an inquiry, your contact information may be shared with independent, licensed real estate agents or brokers who can assist you with the specific project or area you inquired about.</li>
            <li><strong className="text-text-primary">Improve the Platform:</strong> We use analytics data to understand how users interact with the Platform, identify issues, and improve the user experience.</li>
            <li><strong className="text-text-primary">Communicate with you:</strong> We may send you responses to your inquiries and, with your consent, information about new projects or market updates.</li>
            <li><strong className="text-text-primary">Comply with legal obligations:</strong> We may use your information as required by applicable law.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">4. Information Sharing</h2>
          <p className="mb-3">We may share your personal information with:</p>
          <ul className="list-disc pl-6 space-y-2 text-sm">
            <li><strong className="text-text-primary">Licensed real estate professionals:</strong> Independent third-party agents or brokers who can assist with your inquiry. These professionals are not employees or agents of PreConstructionMiami.net.</li>
            <li><strong className="text-text-primary">Service providers:</strong> Third-party companies that help us operate the Platform (hosting, analytics, email delivery).</li>
            <li><strong className="text-text-primary">Legal requirements:</strong> When required by law, court order, or governmental authority.</li>
          </ul>
          <div className="bg-accent-green/5 border border-accent-green/20 rounded-xl p-5 mt-4">
            <p className="text-sm font-medium text-accent-green mb-1">We do not sell your personal data.</p>
            <p className="text-sm">We do not sell, rent, or trade your personal information to third parties for their own marketing purposes.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">5. Cookies and Tracking Technologies</h2>
          <p className="mb-3">The Platform uses cookies and similar technologies for:</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong className="text-text-primary">Essential cookies:</strong> Required for the Platform to function properly.</li>
            <li><strong className="text-text-primary">Analytics cookies:</strong> Help us understand how users interact with the Platform (e.g., pages visited, time on site). We may use services such as Google Analytics or similar tools.</li>
            <li><strong className="text-text-primary">Performance cookies:</strong> Help us measure and improve Platform performance.</li>
          </ul>
          <p className="mt-3 text-sm">
            You can control cookie preferences through your browser settings. Disabling cookies may affect the functionality of the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">6. Data Security</h2>
          <p>
            We implement reasonable administrative, technical, and physical safeguards to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">7. Your Rights</h2>
          <p className="mb-2">You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong className="text-text-primary">Access:</strong> Request a copy of the personal information we hold about you.</li>
            <li><strong className="text-text-primary">Correction:</strong> Request that we correct inaccurate or incomplete information.</li>
            <li><strong className="text-text-primary">Deletion:</strong> Request that we delete your personal information, subject to legal retention requirements.</li>
            <li><strong className="text-text-primary">Opt-out:</strong> Unsubscribe from marketing communications at any time.</li>
          </ul>
          <p className="mt-3 text-sm">
            To exercise any of these rights, please <Link href="/contact-us" className="text-accent-green hover:underline">contact us</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">8. CAN-SPAM Compliance</h2>
          <p>
            We comply with the CAN-SPAM Act. Any marketing emails we send will include an unsubscribe mechanism. We will honor opt-out requests within 10 business days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">9. Children&apos;s Privacy</h2>
          <p>
            The Platform is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at the top of this page indicates when the policy was last revised. Your continued use of the Platform after any changes constitutes your acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">11. Contact Us</h2>
          <p>
            For privacy-related questions or to exercise your data rights, please <Link href="/contact-us" className="text-accent-green hover:underline">contact us</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
