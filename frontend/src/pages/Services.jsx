import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Laptop, Smartphone, Mail, Wifi, HardDrive, MonitorSmartphone,
  Building2, MapPin, Download, ShieldCheck, ArrowRight,
  Bitcoin, UserCheck, Search, Lock,
} from 'lucide-react';

const iconMap = {
  Laptop, Smartphone, Mail, Wifi, HardDrive, MonitorSmartphone,
  Building2, MapPin, Download, ShieldCheck, Bitcoin, UserCheck, Search,
};

export default function Services() {
  const [services, setServices] = useState([]);
  useEffect(() => { api.get('/services').then(r => setServices(r.data)); }, []);

  const featured = services.filter(s => s.featured);
  const regular = services.filter(s => !s.featured);

  return (
    <div data-testid="services-page">
      <section className="relative border-b border-slate-200 bg-gradient-to-b from-blue-50/60 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <Badge variant="outline" className="border-blue-200 text-[#0B3B82] mb-3">Our Services</Badge>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-slate-900 max-w-3xl text-balance">
            One team. Every tech headache. Fixed.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-600">
            A flat list of everything Global Tech Solutions covers — for homes, offices, and everyone in between.
            Most sessions are resolved in a single visit or call.
          </p>
        </div>
      </section>

      {/* Featured: Crypto */}
      {featured.length > 0 && (
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-[#0B3B82] text-white" data-testid="crypto-services-section">
          <div className="absolute inset-0 gts-grid-pattern opacity-20" />
          <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <Badge className="bg-amber-500/15 text-amber-300 border border-amber-400/30 hover:bg-amber-500/20 mb-3">
                  <Bitcoin className="h-3.5 w-3.5 mr-1.5" /> Crypto Services · Flagship offering
                </Badge>
                <h2 className="font-display font-bold text-3xl sm:text-4xl text-white text-balance">Crypto protection, insurance & expert access.</h2>
                <p className="mt-3 text-slate-300 max-w-2xl">
                  The most sensitive support category we handle. Delivered by certified crypto security experts and included for all <strong className="text-amber-300">Lifetime VIP</strong> members.
                </p>
              </div>
              <Button asChild size="lg" className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold">
                <Link to="/pricing#lifetime-vip">See VIP benefits <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((s, i) => {
                const Icon = iconMap[s.icon] || Bitcoin;
                return (
                  <Card key={s.id} className="bg-white/5 border-white/10 backdrop-blur-lg gts-card-hover" data-testid={`crypto-service-${i}`}>
                    <CardContent className="p-6">
                      <div className="h-12 w-12 rounded-lg bg-amber-400/20 border border-amber-400/30 grid place-items-center mb-4">
                        <Icon className="h-6 w-6 text-amber-300" />
                      </div>
                      <h3 className="font-display font-semibold text-lg text-white">{s.title}</h3>
                      <p className="mt-2 text-sm text-slate-300 leading-relaxed">{s.desc}</p>
                      <Button asChild variant="ghost" size="sm" className="mt-4 px-0 text-amber-300 hover:bg-transparent hover:text-amber-200">
                        <Link to={`/book?service=${s.slug}`}>Book this service <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-10 rounded-xl border border-amber-400/30 bg-amber-400/5 p-5 flex items-start gap-4 backdrop-blur-sm">
              <Lock className="h-6 w-6 text-amber-300 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-200 leading-relaxed">
                <strong className="text-white">Trusted by serious holders.</strong> Many of our long-standing clients — including customers with 7-figure wallets — rely on us for wallet audits, seed-phrase vaulting, and SIM-swap protection. All crypto work is conducted under NDA on request.
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Regular services */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="font-display font-bold text-2xl text-slate-900 mb-6">Everyday support services</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {regular.map((s, i) => {
            const Icon = iconMap[s.icon] || Laptop;
            return (
              <Card key={s.id} className="gts-card-hover border-slate-200" data-testid={`service-card-${i}`}>
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-blue-50 border border-blue-100 grid place-items-center mb-4">
                    <Icon className="h-6 w-6 text-[#0B3B82]" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                  <Button asChild variant="ghost" size="sm" className="mt-4 px-0 text-[#0B3B82] hover:bg-transparent hover:text-[#0a3270]">
                    <Link to={`/book?service=${s.slug}`}>Request this service <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-12 border-slate-200 bg-slate-900 text-white overflow-hidden">
          <CardContent className="p-8 sm:p-10 grid md:grid-cols-5 gap-6 items-center">
            <div className="md:col-span-3">
              <h3 className="font-display font-bold text-2xl sm:text-3xl">Not sure what you need?</h3>
              <p className="mt-2 text-slate-300">Describe the issue — we'll diagnose for free and give you an upfront quote before any work starts.</p>
            </div>
            <div className="md:col-span-2 flex md:justify-end">
              <Button asChild size="lg" className="bg-white text-[#0B3B82] hover:bg-blue-50 font-semibold">
                <Link to="/book">Book free diagnosis</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
