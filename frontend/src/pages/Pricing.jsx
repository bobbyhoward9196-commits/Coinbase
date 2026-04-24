import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Check, Star } from 'lucide-react';

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  useEffect(() => { api.get('/plans').then(r => setPlans(r.data)); }, []);
  return (
    <div data-testid="pricing-page">
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50/60 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
          <Badge variant="outline" className="border-blue-200 text-[#0B3B82] mb-3">Pricing</Badge>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-slate-900 text-balance">Simple, transparent pricing.</h1>
          <p className="mt-5 max-w-2xl mx-auto text-lg text-slate-600">No contracts. No hidden fees. Cancel anytime. Custom enterprise plans on request.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p, i) => (
            <Card
              key={p.id}
              className={`relative overflow-hidden border-slate-200 ${p.popular ? 'border-2 border-[#0B3B82] shadow-xl' : ''}`}
              data-testid={`plan-card-${p.name.toLowerCase()}`}
            >
              {p.popular && (
                <div className="absolute top-0 right-0 bg-[#0B3B82] text-white text-xs font-semibold px-3 py-1.5 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" /> Most popular
                </div>
              )}
              <CardContent className="p-6 flex flex-col h-full">
                <h3 className="font-display font-bold text-xl text-slate-900">{p.name}</h3>
                <p className="text-sm text-slate-500 mt-1 min-h-[2.5rem]">{p.description}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display font-extrabold text-4xl text-slate-900">${p.price}</span>
                  <span className="text-sm text-slate-500">/{p.duration}</span>
                </div>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {p.features?.map((f, n) => (
                    <li key={n} className="flex gap-2 text-sm text-slate-700">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className={`mt-6 w-full ${p.popular ? 'bg-[#0B3B82] hover:bg-[#0a3270]' : 'bg-slate-900 hover:bg-slate-800'} text-white`} data-testid={`select-plan-${p.name.toLowerCase()}`}>
                  <Link to={`/book?plan=${p.name.toLowerCase()}`}>Get started</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 text-center">
          Need a custom plan for a larger team? <Link to="/contact" className="text-[#0B3B82] font-semibold underline">Contact us</Link> for an enterprise quote.
        </div>
      </section>
    </div>
  );
}
