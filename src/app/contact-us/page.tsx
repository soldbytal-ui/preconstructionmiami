export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import InquiryForm from '@/components/projects/InquiryForm';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with PreConstructionMiami.net. We help buyers and investors navigate Miami pre-construction condos.',
};

export default function ContactPage() {
  return (
    <div className="container-main pt-24 pb-10">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary">Contact Us</h1>
        <p className="text-text-muted mt-2">We&apos;d love to hear from you. Reach out and we&apos;ll get back within 24 hours.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Inquiry Form */}
        <div className="glass-panel p-0 overflow-hidden">
          <InquiryForm source="contact" />
        </div>

        {/* Location Info */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Our Office</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-text-muted/60 uppercase tracking-wider mb-1">Location</p>
                <p className="text-text-primary">Miami, Florida</p>
              </div>
              <div>
                <p className="text-sm text-text-muted/60 uppercase tracking-wider mb-1">Email</p>
                <a href="mailto:info@preconstructionmiami.net" className="text-accent-green hover:underline">
                  info@preconstructionmiami.net
                </a>
              </div>
              <div>
                <p className="text-sm text-text-muted/60 uppercase tracking-wider mb-1">Hours</p>
                <p className="text-text-primary">Monday - Friday: 9am - 6pm EST</p>
                <p className="text-text-muted text-sm">Weekend appointments available</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">What We Can Help With</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-accent-green mt-0.5">&#x2022;</span>
                <span className="text-text-muted text-sm">Finding the right pre-construction project for your budget and goals</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent-green mt-0.5">&#x2022;</span>
                <span className="text-text-muted text-sm">Understanding deposit structures and payment timelines</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent-green mt-0.5">&#x2022;</span>
                <span className="text-text-muted text-sm">Comparing neighborhoods and developments across South Florida</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent-green mt-0.5">&#x2022;</span>
                <span className="text-text-muted text-sm">Investment analysis and ROI projections for pre-construction units</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent-green mt-0.5">&#x2022;</span>
                <span className="text-text-muted text-sm">Scheduling private showroom visits and virtual tours</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Office Location Map */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Our Location</h2>
        <div className="rounded-2xl overflow-hidden border border-border">
          <img
            src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-l+00D26A(-80.1918,25.8095)/-80.1918,25.8095,15,0/1200x300@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
            alt="Office location - 3250 NE 1st Ave Unit 305, Miami, FL 33137"
            className="w-full h-[300px] object-cover"
          />
        </div>
        <p className="text-sm text-text-muted mt-3">3250 NE 1st Ave Unit 305, Miami, FL 33137, United States</p>
      </div>
    </div>
  );
}
