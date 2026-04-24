import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Badge } from '../components/ui/badge';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '../components/ui/accordion';
import { Input } from '../components/ui/input';
import { Search } from 'lucide-react';

export default function Support() {
  const [faqs, setFaqs] = useState([]);
  const [q, setQ] = useState('');
  useEffect(() => { api.get('/faqs').then(r => setFaqs(r.data)); }, []);
  const filtered = faqs.filter(f => !q || f.q.toLowerCase().includes(q.toLowerCase()) || f.a.toLowerCase().includes(q.toLowerCase()));
  return (
    <div data-testid="support-page">
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50/60 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <Badge variant="outline" className="border-blue-200 text-[#0B3B82] mb-3">Support Center</Badge>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-slate-900 max-w-2xl text-balance">Answers to common questions.</h1>
          <div className="mt-6 relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search FAQs…" className="pl-10 h-12" data-testid="faq-search" />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14">
        <Accordion type="single" collapsible className="space-y-3">
          {filtered.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="rounded-lg border border-slate-200 bg-white px-4 data-[state=open]:border-[#0B3B82]/40" data-testid={`faq-item-${i}`}>
              <AccordionTrigger className="text-left font-display font-semibold text-slate-900 hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
          {filtered.length === 0 && <p className="text-center text-slate-500 py-8">No FAQs match “{q}”. Try a different search.</p>}
        </Accordion>
      </section>
    </div>
  );
}
