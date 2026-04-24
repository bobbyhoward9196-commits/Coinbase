import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Laptop, Smartphone, Mail, Wifi, HardDrive, MonitorSmartphone,
  Building2, MapPin, Download, ShieldCheck, ArrowRight
} from 'lucide-react';

const iconMap = { Laptop, Smartphone, Mail, Wifi, HardDrive, MonitorSmartphone, Building2, MapPin, Download, ShieldCheck };

export default function Services() {
  const [services, setServices] = useState([]);
  useEffect(() => { api.get('/services').then(r => setServices(r.data)); }, []);
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
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => {
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
              <p className="mt-2 text-slate-300">Describe the issue — we’ll diagnose for free and give you an upfront quote before any work starts.</p>
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
