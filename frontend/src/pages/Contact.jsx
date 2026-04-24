import React, { useState } from 'react';
import { api } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/contact', form);
      toast.success('Message sent. We’ll be in touch shortly.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not send message');
    } finally { setSubmitting(false); }
  };
  return (
    <div data-testid="contact-page">
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50/60 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <Badge variant="outline" className="border-blue-200 text-[#0B3B82] mb-3">Contact</Badge>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-slate-900 max-w-2xl text-balance">
            We'd love to hear from you.
          </h1>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 grid lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2 space-y-6">
          {[
            { icon: Phone, t: 'Call us', lines: ['1-800-741-800', 'Mon–Fri 8am–8pm ET'] },
            { icon: Mail, t: 'Email us', lines: ['support@globaltechsolutions.com', 'billing@globaltechsolutions.com'] },
            { icon: Clock, t: 'Emergency support', lines: ['24/7 hotline for existing customers', 'Average response in 6 minutes'] },
            { icon: MapPin, t: 'Where we operate', lines: ['Headquartered in the United States', 'Nationwide remote · on-site in tri-state area'] },
          ].map((c, i) => (
            <Card key={i} className="border-slate-200">
              <CardContent className="p-5 flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 grid place-items-center flex-shrink-0">
                  <c.icon className="h-5 w-5 text-[#0B3B82]" />
                </div>
                <div>
                  <div className="font-display font-semibold text-slate-900">{c.t}</div>
                  {c.lines.map((l, n) => <div key={n} className="text-sm text-slate-600">{l}</div>)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="lg:col-span-3">
          <Card className="border-slate-200">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4" data-testid="contact-form">
                <div><Label>Name *</Label><Input required className="mt-1.5" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} data-testid="ct-name" /></div>
                <div><Label>Email *</Label><Input required type="email" className="mt-1.5" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} data-testid="ct-email" /></div>
                <div><Label>Phone</Label><Input className="mt-1.5" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} data-testid="ct-phone" /></div>
                <div><Label>Subject *</Label><Input required className="mt-1.5" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} data-testid="ct-subject" /></div>
                <div className="sm:col-span-2"><Label>Message *</Label><Textarea required rows={5} className="mt-1.5" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} data-testid="ct-message" /></div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button disabled={submitting} type="submit" className="bg-[#0B3B82] hover:bg-[#0a3270]" data-testid="ct-submit">{submitting ? 'Sending…' : 'Send message'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
