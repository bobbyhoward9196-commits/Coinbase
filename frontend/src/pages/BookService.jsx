import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { CheckCircle2, AlertTriangle, Laptop } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export default function BookService() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    service_type: '',
    device_type: '',
    description: '',
    preferred_date: '',
    preferred_time: '',
    urgency: params.get('urgency') || 'normal',
    contact_name: user?.name || '',
    contact_email: user?.email || '',
    contact_phone: user?.phone || '',
    address: user?.address || '',
  });

  useEffect(() => {
    api.get('/services').then(r => {
      setServices(r.data);
      const slug = params.get('service');
      if (slug) {
        const match = r.data.find(s => s.slug === slug);
        if (match) setForm(f => ({ ...f, service_type: match.title }));
      }
    });
  }, [params]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.service_type || !form.description) {
      toast.error('Please select a service and describe the issue');
      return;
    }
    setSubmitting(true);
    try {
      if (user) {
        await api.post('/bookings/me', form);
      } else {
        await api.post('/bookings', form);
      }
      setDone(true);
      toast.success('Booking received. We’ll call you to confirm.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not submit');
    } finally { setSubmitting(false); }
  };

  if (done) {
    return (
      <section className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-20 text-center" data-testid="booking-success">
        <div className="h-16 w-16 mx-auto rounded-full bg-green-100 grid place-items-center">
          <CheckCircle2 className="h-9 w-9 text-green-600" />
        </div>
        <h1 className="mt-6 font-display font-bold text-3xl text-slate-900">You're booked!</h1>
        <p className="mt-3 text-slate-600">
          A technician will contact you at <span className="font-semibold">{form.contact_email}</span> or <span className="font-semibold">{form.contact_phone}</span> to confirm your appointment.
        </p>
        <div className="mt-8 flex gap-3 justify-center flex-wrap">
          <Button onClick={() => navigate('/')} variant="outline">Back to home</Button>
          {user && <Button onClick={() => navigate('/dashboard')} className="bg-[#0B3B82] hover:bg-[#0a3270]">Go to dashboard</Button>}
          {!user && <Button onClick={() => navigate('/login')} className="bg-[#0B3B82] hover:bg-[#0a3270]">Sign in to track</Button>}
        </div>
      </section>
    );
  }

  return (
    <div data-testid="book-page">
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50/60 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <Badge variant="outline" className="border-blue-200 text-[#0B3B82] mb-3">Book a Service</Badge>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-slate-900 max-w-2xl text-balance">
            Book support in 60 seconds.
          </h1>
          <p className="mt-3 text-slate-600 max-w-xl">We'll call within business hours to confirm your technician, time, and final quote.</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <form className="space-y-6" onSubmit={submit} data-testid="booking-form">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Service needed *</Label>
                  <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v })}>
                    <SelectTrigger className="mt-1.5" data-testid="book-service-select"><SelectValue placeholder="Select a service" /></SelectTrigger>
                    <SelectContent>
                      {services.map(s => <SelectItem key={s.id} value={s.title}>{s.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Device type</Label>
                  <Select value={form.device_type} onValueChange={(v) => setForm({ ...form, device_type: v })}>
                    <SelectTrigger className="mt-1.5" data-testid="book-device-select"><SelectValue placeholder="Select device" /></SelectTrigger>
                    <SelectContent>
                      {['Windows PC','Mac','iPhone','iPad','Android Phone','Android Tablet','Wi-Fi / Router','Printer','Server / Business network','Other'].map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Describe the issue *</Label>
                <Textarea required rows={4} className="mt-1.5" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g., My computer is extremely slow on startup and crashes Chrome." data-testid="book-description" />
              </div>

              <div>
                <Label>Urgency</Label>
                <RadioGroup value={form.urgency} onValueChange={(v) => setForm({ ...form, urgency: v })} className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { v: 'normal', t: 'Normal', d: 'Within 24–48 hrs', icon: Laptop },
                    { v: 'urgent', t: 'Urgent', d: 'Same day', icon: AlertTriangle },
                    { v: 'emergency', t: 'Emergency', d: 'ASAP (24/7)', icon: AlertTriangle },
                  ].map(opt => (
                    <label key={opt.v} htmlFor={`u-${opt.v}`} className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${form.urgency === opt.v ? 'border-[#0B3B82] bg-blue-50/60' : 'border-slate-200 hover:border-slate-300'}`}>
                      <RadioGroupItem value={opt.v} id={`u-${opt.v}`} data-testid={`urgency-${opt.v}`} />
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-slate-900">{opt.t}</div>
                        <div className="text-xs text-slate-500">{opt.d}</div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Preferred date</Label>
                  <Input type="date" className="mt-1.5" value={form.preferred_date} onChange={e => setForm({ ...form, preferred_date: e.target.value })} data-testid="book-date" />
                </div>
                <div>
                  <Label>Preferred time</Label>
                  <Input type="time" className="mt-1.5" value={form.preferred_time} onChange={e => setForm({ ...form, preferred_time: e.target.value })} data-testid="book-time" />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-display font-semibold text-lg text-slate-900 mb-3">Your contact info</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><Label>Name *</Label><Input required className="mt-1.5" value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} data-testid="book-name" /></div>
                  <div><Label>Email *</Label><Input required type="email" className="mt-1.5" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} data-testid="book-email" /></div>
                  <div><Label>Phone *</Label><Input required className="mt-1.5" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} data-testid="book-phone" /></div>
                  <div><Label>Service address (optional)</Label><Input className="mt-1.5" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} data-testid="book-address" /></div>
                </div>
              </div>

              <Button type="submit" size="lg" disabled={submitting} className="w-full bg-[#0B3B82] hover:bg-[#0a3270]" data-testid="book-submit-btn">
                {submitting ? 'Submitting…' : 'Request appointment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
