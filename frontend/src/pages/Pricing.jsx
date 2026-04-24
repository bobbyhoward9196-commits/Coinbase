import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Check, Star, Crown, ShieldCheck, UserCheck } from 'lucide-react';

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  useEffect(() => { api.get('/plans').then(r => setPlans(r.data)); }, []);

  const isVip = (p) => p.name?.toLowerCase().includes('vip');

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
          {plans.map((p) => {
            const vip = isVip(p);
            return (
              <Card
                key={p.id}
                id={vip ? 'lifetime-vip' : undefined}
                className={`relative overflow-hidden transition-all ${
                  vip
                    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-[#0B3B82] text-white border-amber-400/40 shadow-2xl shadow-amber-500/10 lg:scale-[1.02]'
                    : p.popular
                      ? 'border-2 border-[#0B3B82] shadow-xl'
                      : 'border-slate-200'
                }`}
                data-testid={`plan-card-${p.name.toLowerCase().replace(/\s/g,'-')}`}
              >
                {vip && (
                  <>
                    <div className="absolute inset-0 gts-grid-pattern opacity-10 pointer-events-none" />
                    <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
                    <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 flex items-center gap-1 z-10">
                      <Crown className="h-3.5 w-3.5" /> Most exclusive
                    </div>
                  </>
                )}
                {!vip && p.popular && (
                  <div className="absolute top-0 right-0 bg-[#0B3B82] text-white text-xs font-semibold px-3 py-1.5 flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" /> Most popular
                  </div>
                )}
                <CardContent className={`p-6 flex flex-col h-full ${vip ? 'relative' : ''}`}>
                  <h3 className={`font-display font-bold text-xl ${vip ? 'text-white' : 'text-slate-900'}`}>{p.name}</h3>
                  <p className={`text-sm mt-1 min-h-[2.5rem] ${vip ? 'text-slate-300' : 'text-slate-500'}`}>{p.description}</p>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className={`font-display font-extrabold text-4xl ${vip ? 'text-white' : 'text-slate-900'}`}>${p.price}</span>
                    <span className={`text-sm ${vip ? 'text-slate-400' : 'text-slate-500'}`}>/{p.duration}</span>
                  </div>

                  {vip && (
                    <div className="mt-5 space-y-2">
                      <div className="flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 backdrop-blur-sm px-3 py-2">
                        <ShieldCheck className="h-4 w-4 text-amber-300 flex-shrink-0" />
                        <div className="text-xs font-semibold text-amber-200">Crypto Protection included</div>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 backdrop-blur-sm px-3 py-2">
                        <UserCheck className="h-4 w-4 text-amber-300 flex-shrink-0" />
                        <div className="text-xs font-semibold text-amber-200">SEC-Approved Advisor Access</div>
                      </div>
                    </div>
                  )}

                  <ul className="mt-6 space-y-2.5 flex-1">
                    {p.features?.map((f, n) => (
                      <li key={n} className={`flex gap-2 text-sm ${vip ? 'text-slate-200' : 'text-slate-700'}`}>
                        <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${vip ? 'text-amber-300' : 'text-green-600'}`} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={`mt-6 w-full font-semibold ${
                      vip
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                        : p.popular
                          ? 'bg-[#0B3B82] hover:bg-[#0a3270] text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                    data-testid={`select-plan-${p.name.toLowerCase().replace(/\s/g,'-')}`}
                  >
                    <Link to={`/book?plan=${p.name.toLowerCase().replace(/\s/g,'-')}`}>Get started</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 text-center">
          Need a custom plan for a larger team? <Link to="/contact" className="text-[#0B3B82] font-semibold underline">Contact us</Link> for an enterprise quote.
        </div>

        <p className="mt-6 text-center text-xs text-slate-400 max-w-3xl mx-auto">
          SEC-approved advisor access is provided through our independent licensed partner. Global Tech Solutions is an independent technical support provider and is not itself a registered investment advisor.
        </p>
      </section>
    </div>
  );
}
