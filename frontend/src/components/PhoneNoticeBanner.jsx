import React, { useEffect, useState } from 'react';
import { X, Phone } from 'lucide-react';

const DISMISS_KEY = 'gts_phone_notice_dismissed_v1';

export default function PhoneNoticeBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(DISMISS_KEY)) setOpen(true);
  }, []);

  if (!open) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setOpen(false);
  };

  return (
    <div className="relative bg-amber-50 border-b border-amber-200" data-testid="phone-notice-banner">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3">
        <div className="hidden sm:flex h-8 w-8 rounded-full bg-amber-100 border border-amber-200 items-center justify-center flex-shrink-0">
          <Phone className="h-4 w-4 text-amber-800" />
        </div>
        <div className="flex-1 text-sm text-amber-900 leading-snug">
          <strong>Phone number update:</strong> Our official support line has changed from
          <span className="mx-1 line-through text-amber-700">844-331-2777</span>
          to
          <a href="tel:18007418000" className="mx-1 font-bold underline decoration-amber-600 underline-offset-2 hover:text-[#0B3B82]" data-testid="new-phone-number">
            1-800-741-800
          </a>
          . Please update your contacts.
        </div>
        <button onClick={dismiss} className="flex-shrink-0 p-1 rounded-md hover:bg-amber-100 text-amber-800" aria-label="Dismiss" data-testid="dismiss-phone-notice">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
