import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import {
  ShieldCheck, Headphones, Zap, Clock, Star, ArrowRight,
  Laptop, Smartphone, Mail, Wifi, HardDrive, MonitorSmartphone,
  Building2, MapPin, Download, Phone, CheckCircle2, AlertTriangle,
  Users, Award, Lock, Bitcoin, UserCheck, Search, Lock as LockIcon
} from 'lucide-react';

const iconMap = {
  Laptop, Smartphone, Mail, Wifi, HardDrive, MonitorSmartphone,
  Building2, MapPin, Download, ShieldCheck, Bitcoin, UserCheck, Search,
};

export default function Home() {
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/services').then(r => setServices(r.data));
    api.get('/reviews').then(r => setReviews(r.data));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/contact', form);
      toast.success('Message sent. We’ll contact you shortly.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not send message');
    } finally { setSubmitting(false); }
  };

  return (
    <div data-testid="home-page">
      {/* Hero */}
      <section className="relative overflow-hidden gts-gradient-hero text-white">
        <div className="absolute inset-0 gts-grid-pattern opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-32">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 gts-fade-up">
              <Badge className="bg-blue-500/15 text-blue-200 border border-blue-400/30 hover:bg-blue-500/20 mb-5">
                <span className="relative mr-2 flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 gts-pulse-ring"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span></span>
                Technicians online · avg response 6 min
              </Badge>
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] text-balance">
                Reliable Technical Support <span className="text-blue-300">When You Need It</span>
              </h1>
              <p className="mt-6 text-lg text-slate-300 max-w-xl leading-relaxed">
                From a stubborn email setup to a full business network — our certified technicians fix computers, phones, Wi-Fi, security, and everything in between. Remote or on-site, any time.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-white text-[#0B3B82] hover:bg-blue-50 font-semibold" data-testid="hero-book-btn">
                  <Link to="/book">Book Support <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/15 backdrop-blur" data-testid="hero-login-btn">
                  <Link to="/login">Customer Login</Link>
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-slate-300">
                <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-blue-300" /> SSL-encrypted sessions</div>
                <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-blue-300" /> 24/7 emergency line</div>
                <div className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-400 fill-yellow-400" /> 4.9 / 5 · 2,400+ reviews</div>
              </div>
            </div>

            <div className="lg:col-span-5 hidden lg:block">
              <div className="relative gts-fade-up" style={{ animationDelay: '120ms' }}>
                <div className="absolute -inset-4 bg-blue-500/20 blur-3xl rounded-full" />
                <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80" alt="Certified technician assisting a client" className="w-full aspect-[4/5] object-cover" />
                  <div className="absolute bottom-4 left-4 right-4 gts-glass-dark rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-500/20 grid place-items-center">
                        <ShieldCheck className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Ravi O. — connected</div>
                        <div className="text-xs text-slate-300">Network Security · 4.9 rating</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: Users, v: '12,500+', l: 'Customers supported' },
            { icon: Award, v: '22 yrs', l: 'In business' },
            { icon: Lock, v: 'A+', l: 'BBB equivalent rating' },
            { icon: Headphones, v: '24/7', l: 'Emergency response' },
          ].map((t, i) => (
            <div key={i} className="flex flex-col items-center gap-1" data-testid={`trust-${i}`}>
              <t.icon className="h-5 w-5 text-[#0B3B82]" />
              <div className="font-display text-xl font-bold text-slate-900">{t.v}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">{t.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Service highlights */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl">
          <Badge variant="outline" className="border-blue-200 text-[#0B3B82] mb-3">Services</Badge>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 text-balance">
            Everything you need to keep your tech running.
          </h2>
          <p className="mt-3 text-base text-slate-600">
            One call handles it all — from a cranky laptop to a whole office network. Here’s a taste.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.slice(0, 6).map((s, i) => {
            const Icon = iconMap[s.icon] || Laptop;
            return (
              <Card key={s.id} className="gts-card-hover border-slate-200 overflow-hidden" data-testid={`home-service-${i}`}>
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-blue-50 border border-blue-100 grid place-items-center mb-4">
                    <Icon className="h-6 w-6 text-[#0B3B82]" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                  <Link to="/services" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#0B3B82] hover:gap-2 transition-all">
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <Button asChild variant="outline" className="border-slate-300" data-testid="home-all-services-btn">
            <Link to="/services">View all services <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <Badge variant="outline" className="border-blue-200 text-[#0B3B82] mb-3">Reviews</Badge>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-900">
                What our customers say.
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">{[1,2,3,4,5].map(n => <Star key={n} className="h-5 w-5 text-yellow-400 fill-yellow-400" />)}</div>
              <div className="text-sm text-slate-600 font-medium">4.9 / 5 from 2,400+ reviews</div>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {reviews.slice(0, 6).map((r, i) => (
              <Card key={r.id} className="border-slate-200 bg-white" data-testid={`review-${i}`}>
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(r.rating || 5)].map((_, n) => <Star key={n} className="h-4 w-4 text-yellow-400 fill-yellow-400" />)}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">"{r.text}"</p>
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{r.name}</div>
                      <div className="text-xs text-slate-500">{r.location}</div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{r.service}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Crypto highlight */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-[#0B3B82] text-white" data-testid="crypto-section">
        <div className="absolute inset-0 gts-grid-pattern opacity-20" />
        <div className="absolute -top-20 -right-20 h-[420px] w-[420px] rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-[420px] w-[420px] rounded-full bg-blue-500/15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="flex flex-col items-start">
            <Badge className="bg-amber-500/15 text-amber-300 border border-amber-400/30 hover:bg-amber-500/20 mb-5">
              <Bitcoin className="h-3.5 w-3.5 mr-1.5" /> Crypto Security · VIP Benefit
            </Badge>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-balance leading-tight max-w-3xl">
              The only tech support line trusted by <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">serious crypto holders</span>.
            </h2>
            <p className="mt-5 text-lg text-slate-300 max-w-2xl leading-relaxed">
              Wallets, seed phrases, hardware keys, exchange account recovery — we've been protecting our customers' digital assets since well before it was cool.
              Our <strong className="text-white">Lifetime VIP</strong> plan includes a direct line to a certified crypto security expert.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, t: 'Crypto Wallet Protection', d: 'Hardware wallet setup, seed-phrase vaulting, MFA, isolated device hardening for MetaMask, Ledger, Trezor.' },
              { icon: LockIcon, t: 'Crypto Insurance Coverage', d: 'Protection against wallet compromise, phishing, and SIM-swap theft — up to $100K/incident for VIP clients.' },
              { icon: UserCheck, t: 'Crypto Expert Direct Access', d: 'Priority line to a certified crypto security expert, 24/7, for audits and real-time guidance.' },
              { icon: Search, t: 'Recovery & Forensics', d: 'Forensic tracing, exchange communication, and structured recovery for stolen or mis-sent crypto.' },
            ].map((c, i) => (
              <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-lg gts-card-hover overflow-hidden" data-testid={`crypto-card-${i}`}>
                <CardContent className="p-6">
                  <div className="h-11 w-11 rounded-lg bg-amber-400/20 border border-amber-400/30 grid place-items-center mb-4">
                    <c.icon className="h-5 w-5 text-amber-300" />
                  </div>
                  <h3 className="font-display font-semibold text-white">{c.t}</h3>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">{c.d}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold" data-testid="crypto-vip-cta">
              <Link to="/pricing#lifetime-vip">Explore VIP Crypto Plan <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10">
              <Link to="/book?service=crypto-protection">Book a crypto audit</Link>
            </Button>
            <p className="text-xs text-slate-400 ml-2">NDA available on request · all sessions encrypted</p>
          </div>
        </div>
      </section>

      {/* Emergency section */}
      <section className="relative overflow-hidden gts-gradient-ocean text-white">
        <div className="absolute inset-0 gts-grid-pattern opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid md:grid-cols-5 gap-10 items-center">
            <div className="md:col-span-3">
              <Badge className="bg-red-500/20 text-red-200 border-red-400/30 mb-4">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Emergency Support
              </Badge>
              <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-balance leading-tight">
                System down? Ransomware? Locked out?
              </h2>
              <p className="mt-4 text-blue-100 text-lg max-w-xl">
                Our emergency line is open 24/7. Describe the issue and a senior technician is on a secure remote session in under 15 minutes.
              </p>
            </div>
            <div className="md:col-span-2">
              <Card className="bg-white/10 border-white/20 backdrop-blur-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-red-500/20 grid place-items-center">
                      <Phone className="h-6 w-6 text-red-300" />
                    </div>
                    <div>
                      <div className="text-xs text-blue-200 uppercase tracking-wider">Emergency hotline</div>
                      <a href="tel:18007418000" className="font-display text-2xl font-bold text-white">1-800-741-800</a>
                    </div>
                  </div>
                  <Button asChild size="lg" className="w-full bg-white text-[#0B3B82] hover:bg-blue-50 font-semibold" data-testid="emergency-book-btn">
                    <Link to="/book?urgency=emergency">Request emergency help</Link>
                  </Button>
                  <p className="text-xs text-blue-100 text-center">Average connection time: 6 minutes</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section id="contact" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <Badge variant="outline" className="border-blue-200 text-[#0B3B82] mb-3">Contact</Badge>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 text-balance">
              Tell us what’s broken. We’ll fix it.
            </h2>
            <p className="mt-3 text-slate-600">
              Send a short message and we’ll call or email back — usually within the hour during business hours.
            </p>
            <div className="mt-8 space-y-4 text-sm">
              <div className="flex items-start gap-3"><Phone className="h-5 w-5 text-[#0B3B82] mt-0.5" /> <div><div className="font-semibold">1-800-741-800</div><div className="text-slate-500">Mon–Fri 8am–8pm ET · Weekends on call</div></div></div>
              <div className="flex items-start gap-3"><Mail className="h-5 w-5 text-[#0B3B82] mt-0.5" /> <div><div className="font-semibold">support@globaltechsolutions.com</div><div className="text-slate-500">Billing: billing@globaltechsolutions.com</div></div></div>
              <div className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" /> <div><div className="font-semibold">No-fix-no-fee on first session</div><div className="text-slate-500">If we can’t resolve it, you don’t pay.</div></div></div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6 sm:p-8">
                <form className="grid sm:grid-cols-2 gap-4" onSubmit={submit} data-testid="home-contact-form">
                  <div><label className="text-sm font-medium text-slate-700">Name</label><Input required className="mt-1.5" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} data-testid="contact-name" /></div>
                  <div><label className="text-sm font-medium text-slate-700">Email</label><Input required type="email" className="mt-1.5" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} data-testid="contact-email" /></div>
                  <div><label className="text-sm font-medium text-slate-700">Phone (optional)</label><Input className="mt-1.5" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} data-testid="contact-phone" /></div>
                  <div><label className="text-sm font-medium text-slate-700">Subject</label><Input required className="mt-1.5" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} data-testid="contact-subject" /></div>
                  <div className="sm:col-span-2"><label className="text-sm font-medium text-slate-700">How can we help?</label><Textarea required rows={5} className="mt-1.5" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} data-testid="contact-message" /></div>
                  <div className="sm:col-span-2 flex items-center justify-between flex-wrap gap-3">
                    <p className="text-xs text-slate-500">By submitting, you agree to our <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>
                    <Button type="submit" disabled={submitting} className="bg-[#0B3B82] hover:bg-[#0a3270]" data-testid="contact-submit-btn">
                      {submitting ? 'Sending…' : 'Send message'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
