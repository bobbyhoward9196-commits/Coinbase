import React from 'react';

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14" data-testid="privacy-page">
      <h1 className="font-display font-extrabold text-4xl text-slate-900">Privacy Policy</h1>
      <p className="mt-3 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
      <div className="prose prose-slate mt-8 max-w-none text-slate-700 space-y-5 leading-relaxed text-[15px]">
        <section>
          <h2 className="font-display font-bold text-xl text-slate-900">1. Information we collect</h2>
          <p>We collect the information you provide when you book a service, create an account, or contact us: name, email, phone, address, device information, and the nature of the issue. For remote sessions, we temporarily collect session logs to improve service quality.</p>
        </section>
        <section>
          <h2 className="font-display font-bold text-xl text-slate-900">2. How we use it</h2>
          <p>We use your information to deliver the services you requested, schedule appointments, communicate with you, issue invoices, and improve our operations. We do not sell your personal information — ever.</p>
        </section>
        <section>
          <h2 className="font-display font-bold text-xl text-slate-900">3. Security</h2>
          <p>All sessions are encrypted in transit. Passwords are stored using industry-standard one-way hashing. Sensitive information is accessed only by assigned technicians under a confidentiality policy.</p>
        </section>
        <section>
          <h2 className="font-display font-bold text-xl text-slate-900">4. Cookies</h2>
          <p>We use essential cookies to keep you signed in. No third-party tracking cookies are used on our customer portal.</p>
        </section>
        <section>
          <h2 className="font-display font-bold text-xl text-slate-900">5. Your rights</h2>
          <p>You can request access to, correction of, or deletion of your personal data at any time by contacting <a href="mailto:privacy@globaltechsolutions.com" className="text-[#0B3B82] underline">privacy@globaltechsolutions.com</a>.</p>
        </section>
        <section>
          <h2 className="font-display font-bold text-xl text-slate-900">6. Third-party brand disclaimer</h2>
          <p>Global Tech Solutions is an independent technical support provider and is not affiliated with, endorsed, or sponsored by Microsoft, Apple, Google, or any other third-party brand unless explicitly stated as an authorized partner.</p>
        </section>
      </div>
    </div>
  );
}
