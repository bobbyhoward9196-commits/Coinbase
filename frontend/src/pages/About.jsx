import React from 'react';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { ShieldCheck, Clock, Users, Award, MapPin, Heart } from 'lucide-react';

export default function About() {
  return (
    <div data-testid="about-page">
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50/60 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <Badge variant="outline" className="border-blue-200 text-[#0B3B82] mb-3">About Us</Badge>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-slate-900 max-w-3xl text-balance">
            Technical support, done like it used to be done — <span className="text-[#0B3B82]">by people who actually care</span>.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-600">
            Global Tech Solutions has been quietly fixing computers, phones, networks, and businesses since the early 2000s. No scripts. No upsells. Just real technicians with decades of combined experience.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-display font-bold text-3xl text-slate-900">Our story</h2>
            <div className="mt-4 space-y-4 text-slate-700 leading-relaxed">
              <p>We started as a small team of technicians helping local families and small businesses with everyday tech problems. Twenty years later, we still pick up the phone ourselves — the business has grown, but the ethic hasn’t.</p>
              <p>Some of our customers have been with us since day one. A few, like Sanford in New Jersey, have trusted us with their devices and data since 2017 — through four address changes, countless security upgrades, and everything in between.</p>
              <p>Today we serve over 12,500 individuals and small to mid-sized businesses across the United States with managed IT, cybersecurity, cloud infrastructure, help-desk support, and old-fashioned repair work.</p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-blue-100 blur-3xl rounded-full opacity-50" />
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=900&q=80"
              alt="Technicians collaborating"
              className="relative rounded-2xl shadow-xl w-full aspect-[4/3] object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-slate-50 border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-display font-bold text-3xl text-slate-900 text-center">What we stand for</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ShieldCheck, t: 'Security first', d: 'Every session is encrypted, every technician is vetted, and no credentials ever leave your device.' },
              { icon: Clock, t: 'Respect your time', d: 'Most calls are resolved in one session. Your appointment time is a promise, not a window.' },
              { icon: Heart, t: 'No upsell pressure', d: 'You get diagnosed and quoted up front. If we can’t fix it, you don’t pay. Ever.' },
              { icon: Users, t: 'Relationships, not tickets', d: 'Each customer is assigned a dedicated technician who actually remembers your setup.' },
              { icon: Award, t: 'Certified expertise', d: 'Our team holds CompTIA, Microsoft, Cisco, and SonicWall certifications — renewed yearly.' },
              { icon: MapPin, t: 'On-site across the US', d: 'Remote-first, but we’ll dispatch a technician to your office when it matters.' },
            ].map((v, i) => (
              <Card key={i} className="border-slate-200 bg-white">
                <CardContent className="p-6">
                  <div className="h-11 w-11 rounded-lg bg-blue-50 border border-blue-100 grid place-items-center mb-4">
                    <v.icon className="h-5 w-5 text-[#0B3B82]" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-slate-900">{v.t}</h3>
                  <p className="mt-2 text-sm text-slate-600">{v.d}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
