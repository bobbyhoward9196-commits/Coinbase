import React from 'react';

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14" data-testid="terms-page">
      <h1 className="font-display font-extrabold text-4xl text-slate-900">Terms of Service</h1>
      <p className="mt-3 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
      <div className="prose prose-slate mt-8 max-w-none text-slate-700 space-y-5 leading-relaxed text-[15px]">
        <section>
          <h2 className="font-display font-bold text-xl text-slate-900">1. Services</h2>
          <p>Global Tech Solutions provides remote and on-site technical support for computers, phones, networks, and related devices. By booking a service, you authorize our technicians to perform the requested work on your equipment.</p>
        </section>
        <section>
          <h2 className="font-display font-bold text-xl text-slate-900">2. Fees and payment</h2>
          <p>Service fees are quoted up front. Subscription plans renew on the cycle selected at checkout. Lifetime plans are one-time payments with no renewal. All fees are non-refundable once work has begun, unless covered by our no-fix-no-fee guarantee.</p>
        </section>
        <section>
          <h2 className="font-display font-bold text-xl text-slate-900">3. Data responsibility</h2>
          <p>Customers are responsible for backing up their data before any repair. While we take utmost care, Global Tech Solutions is not liable for data loss resulting from pre-existing hardware failure.</p>
        </section>
        <section>
          <h2 className="font-display font-bold text-xl text-slate-900">4. Brand disclaimer</h2>
          <p>Global Tech Solutions is an independent service provider. We are not affiliated with Microsoft, Apple, Google, or any other third-party brand unless explicitly stated. All trademarks are property of their respective owners.</p>
        </section>
        <section>
          <h2 className="font-display font-bold text-xl text-slate-900">5. Cancellation</h2>
          <p>You may cancel or reschedule an appointment up to 4 hours before the scheduled time without charge. Subscription plans may be cancelled from your customer dashboard at any time.</p>
        </section>
        <section>
          <h2 className="font-display font-bold text-xl text-slate-900">6. Limitation of liability</h2>
          <p>Our total liability for any claim arising from services provided shall not exceed the fees paid for the specific service giving rise to the claim. We are not liable for indirect, consequential, or incidental damages.</p>
        </section>
        <section>
          <h2 className="font-display font-bold text-xl text-slate-900">7. Contact</h2>
          <p>For any questions about these terms, contact <a href="mailto:legal@globaltechsolutions.com" className="text-[#0B3B82] underline">legal@globaltechsolutions.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
