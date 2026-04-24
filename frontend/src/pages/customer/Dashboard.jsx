import React, { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { DashboardShell } from '../../components/DashboardShell';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '../../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import {
  Calendar, CreditCard, Star, Phone, Mail, Plus, Download, Send, MessageSquare, Shield, ClipboardList, TicketCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import Software from './Software';
import Devices from './Devices';

const StatCard = ({ icon: Icon, label, value, hint, tint = 'blue' }) => {
  const tints = {
    blue: 'bg-blue-50 text-[#0B3B82] border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
  };
  return (
    <Card className="border-slate-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">{label}</div>
            <div className="mt-1 font-display font-bold text-2xl text-slate-900">{value}</div>
            {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
          </div>
          <div className={`h-10 w-10 rounded-lg border grid place-items-center ${tints[tint]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ---------- OVERVIEW ----------
const Overview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [appts, setAppts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/appointments'),
      api.get('/invoices'),
      api.get('/tickets'),
      api.get(`/customers/${user.id}`),
    ]).then(([s, a, i, t, c]) => {
      setStats(s.data); setAppts(a.data); setInvoices(i.data); setTickets(t.data); setCustomer(c.data);
    });
  }, [user.id]);

  const tech = customer?.technician;

  return (
    <div className="space-y-6" data-testid="customer-overview">
      <div>
        <h2 className="font-display font-bold text-2xl text-slate-900">Welcome back, {user.name.split(' ')[0]}.</h2>
        <p className="text-slate-600 text-sm mt-1">Here's what's happening with your support account.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Calendar} label="Upcoming" value={stats.upcoming_appointments ?? 0} hint="Scheduled appointments" />
        <StatCard icon={TicketCheck} label="Open tickets" value={stats.open_tickets ?? 0} hint="Being worked on" tint="amber" />
        <StatCard icon={CreditCard} label="Invoices" value={stats.invoices ?? 0} hint="Total on file" tint="green" />
        <StatCard icon={Shield} label="Plan" value={customer?.active_plan || 'None'} hint={customer?.customer_since ? `Customer since ${customer.customer_since}` : ''} tint="rose" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Assigned technician */}
        <Card className="border-slate-200 lg:col-span-1" data-testid="assigned-tech-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-slate-900">Your technician</h3>
              <Badge variant="secondary" className="text-[10px]">Dedicated</Badge>
            </div>
            {tech ? (
              <div className="mt-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 border border-slate-200">
                    <AvatarImage src={tech.photo} />
                    <AvatarFallback>{tech.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-slate-900">{tech.name}</div>
                    <div className="text-xs text-slate-500">{tech.specialization}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {[1,2,3,4,5].map(n => <Star key={n} className={`h-3.5 w-3.5 ${n <= Math.round(tech.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />)}
                      <span className="text-xs text-slate-500 ml-1">{tech.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" />{tech.phone}</div>
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" />{tech.email}</div>
                </div>
                {(tech.certification || tech.level || tech.joined_year) && (
                  <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3 space-y-1 text-xs">
                    {tech.certification && <div className="flex justify-between gap-2"><span className="text-slate-500">Certification</span><span className="font-semibold text-slate-900 text-right">{tech.certification}</span></div>}
                    {tech.certification_number && <div className="flex justify-between gap-2"><span className="text-slate-500">Cert #</span><span className="font-mono text-slate-900">{tech.certification_number}</span></div>}
                    {tech.level && <div className="flex justify-between gap-2"><span className="text-slate-500">Level</span><span className="font-semibold text-slate-900">{tech.level}</span></div>}
                    {tech.joined_year && <div className="flex justify-between gap-2"><span className="text-slate-500">Joined</span><span className="font-semibold text-slate-900">{tech.joined_year}</span></div>}
                  </div>
                )}
                <Button asChild className="w-full mt-4 bg-[#0B3B82] hover:bg-[#0a3270]" data-testid="chat-tech-btn">
                  <Link to={`/dashboard/messages?with=${tech.id}`}><MessageSquare className="h-4 w-4 mr-2" /> Message technician</Link>
                </Button>
              </div>
            ) : <p className="mt-4 text-sm text-slate-500">No technician assigned yet.</p>}
          </CardContent>
        </Card>

        {/* Upcoming appointments */}
        <Card className="border-slate-200 lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-slate-900">Upcoming appointments</h3>
              <Button asChild size="sm" className="bg-[#0B3B82] hover:bg-[#0a3270]" data-testid="book-new-btn"><Link to="/book"><Plus className="h-3.5 w-3.5 mr-1" />New</Link></Button>
            </div>
            <div className="mt-4 divide-y divide-slate-100">
              {appts.filter(a => a.status === 'scheduled').slice(0, 4).map(a => (
                <div key={a.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{a.service_type}</div>
                    <div className="text-xs text-slate-500">{new Date(a.scheduled_date).toLocaleDateString()} · {a.scheduled_time}</div>
                  </div>
                  <Badge variant="outline" className="capitalize">{a.status}</Badge>
                </div>
              ))}
              {!appts.some(a => a.status === 'scheduled') && <p className="py-6 text-sm text-slate-500 text-center">No upcoming appointments. <Link to="/book" className="text-[#0B3B82] font-medium">Book one →</Link></p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent invoices */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <h3 className="font-display font-semibold text-slate-900">Recent invoices</h3>
          <Table className="mt-3">
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.slice(0, 5).map(i => (
                <TableRow key={i.id} data-testid={`invoice-row-${i.invoice_number}`}>
                  <TableCell className="font-mono text-xs">{i.invoice_number}</TableCell>
                  <TableCell className="max-w-[280px] truncate">{i.description}</TableCell>
                  <TableCell>{new Date(i.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="font-semibold">${i.amount.toFixed(2)}</TableCell>
                  <TableCell><Badge variant={i.status === 'paid' ? 'secondary' : 'outline'} className={i.status === 'paid' ? 'bg-green-100 text-green-800 border-green-200' : ''}>{i.status}</Badge></TableCell>
                  <TableCell><Button asChild size="sm" variant="ghost"><Link to={`/dashboard/invoices`}><Download className="h-3.5 w-3.5" /></Link></Button></TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-slate-500 py-6">No invoices yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// ---------- APPOINTMENTS ----------
const Appointments = () => {
  const [appts, setAppts] = useState([]);
  useEffect(() => { api.get('/appointments').then(r => setAppts(r.data)); }, []);
  return (
    <Card className="border-slate-200" data-testid="customer-appointments">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-xl">My Appointments</h2>
          <Button asChild className="bg-[#0B3B82] hover:bg-[#0a3270]"><Link to="/book"><Plus className="h-4 w-4 mr-1" />Book new</Link></Button>
        </div>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appts.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.service_type}</TableCell>
                <TableCell>{a.technician?.name || '—'}</TableCell>
                <TableCell>{new Date(a.scheduled_date).toLocaleDateString()}</TableCell>
                <TableCell>{a.scheduled_time}</TableCell>
                <TableCell><Badge variant={a.status === 'completed' ? 'secondary' : 'outline'} className={a.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' : ''}>{a.status}</Badge></TableCell>
              </TableRow>
            ))}
            {appts.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-slate-500 py-6">No appointments yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// ---------- INVOICES ----------
const Invoices = () => {
  const [invs, setInvs] = useState([]);
  const [open, setOpen] = useState(null);
  useEffect(() => { api.get('/invoices').then(r => setInvs(r.data)); }, []);
  const download = (inv) => {
    const lines = [
      `INVOICE ${inv.invoice_number}`,
      `Global Tech Solutions`,
      `Date: ${new Date(inv.created_at).toLocaleDateString()}`,
      `Due: ${inv.due_date || '—'}`,
      ``,
      `Description: ${inv.description}`,
      `Amount: $${inv.amount.toFixed(2)}`,
      `Status: ${inv.status}`,
      `Payment method: ${inv.payment_method || '—'}`,
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${inv.invoice_number}.txt`; a.click();
    URL.revokeObjectURL(url);
  };
  const total = invs.reduce((s, i) => s + (i.amount || 0), 0);
  const paid = invs.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  return (
    <div className="space-y-6" data-testid="customer-invoices">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CreditCard} label="Total billed" value={`$${total.toFixed(2)}`} />
        <StatCard icon={CreditCard} label="Paid" value={`$${paid.toFixed(2)}`} tint="green" />
        <StatCard icon={CreditCard} label="Outstanding" value={`$${(total - paid).toFixed(2)}`} tint="amber" />
      </div>
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <h2 className="font-display font-bold text-xl">Payment history & invoices</h2>
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invs.map(i => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">{i.invoice_number}</TableCell>
                  <TableCell className="max-w-[260px] truncate">{i.description}</TableCell>
                  <TableCell>{new Date(i.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{i.payment_method || '—'}</TableCell>
                  <TableCell className="font-semibold">${i.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={i.status === 'paid' ? 'secondary' : 'outline'} className={i.status === 'paid' ? 'bg-green-100 text-green-800 border-green-200' : ''}>{i.status}</Badge>
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setOpen(i)}>View</Button>
                    <Button size="sm" variant="ghost" onClick={() => download(i)} data-testid={`download-${i.invoice_number}`}><Download className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="sm:max-w-lg">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>Invoice {open.invoice_number}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Issued</span><span>{new Date(open.created_at).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Due</span><span>{open.due_date || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Method</span><span>{open.payment_method || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="capitalize">{open.status}</span></div>
                <div className="pt-3 border-t">
                  <div className="font-semibold mb-1">Description</div>
                  <p className="text-slate-600">{open.description}</p>
                </div>
                <div className="pt-3 border-t flex justify-between font-semibold">
                  <span>Total</span><span className="font-display text-2xl text-[#0B3B82]">${open.amount.toFixed(2)}</span>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => download(open)} className="bg-[#0B3B82] hover:bg-[#0a3270]"><Download className="h-4 w-4 mr-2" />Download</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ---------- HISTORY ----------
const History = () => {
  const [hist, setHist] = useState([]);
  useEffect(() => { api.get('/service-history').then(r => setHist(r.data)); }, []);
  return (
    <Card className="border-slate-200" data-testid="customer-history">
      <CardContent className="p-6">
        <h2 className="font-display font-bold text-xl">Service history</h2>
        <p className="text-sm text-slate-500 mt-1">Every service we've performed on your account.</p>
        <div className="mt-6 space-y-3">
          {hist.map(h => (
            <div key={h.id} className="flex gap-4 p-4 rounded-lg border border-slate-200 bg-white">
              <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 grid place-items-center flex-shrink-0">
                <ClipboardList className="h-5 w-5 text-[#0B3B82]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <div className="font-display font-semibold text-slate-900">{h.service_type}</div>
                  <div className="text-xs text-slate-500">· {new Date(h.completed_at).toLocaleDateString()}</div>
                </div>
                <p className="text-sm text-slate-600 mt-1">{h.description}</p>
                {h.notes && <p className="text-xs text-slate-500 mt-1 italic">"{h.notes}"</p>}
                {h.technician_name && <div className="text-xs text-slate-500 mt-2">Technician: <span className="font-medium">{h.technician_name}</span></div>}
              </div>
            </div>
          ))}
          {hist.length === 0 && <p className="text-sm text-slate-500 text-center py-6">No service history yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
};

// ---------- TICKETS ----------
const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', priority: 'medium', category: 'general' });

  const load = () => api.get('/tickets').then(r => setTickets(r.data));
  useEffect(() => { load(); }, []);

  const submit = async () => {
    await api.post('/tickets', form);
    toast.success('Ticket created');
    setOpen(false); setForm({ subject: '', description: '', priority: 'medium', category: 'general' });
    load();
  };

  return (
    <Card className="border-slate-200" data-testid="customer-tickets">
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <h2 className="font-display font-bold text-xl">Support tickets</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-[#0B3B82] hover:bg-[#0a3270]" data-testid="new-ticket-btn"><Plus className="h-4 w-4 mr-1" />New ticket</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Open a support ticket</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Subject</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} data-testid="ticket-subject" /></div>
                <div><Label>Description</Label><Textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} data-testid="ticket-description" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Priority</Label>
                    <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['low','medium','high','urgent'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['general','hardware','software','email','network','security','billing'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter><Button onClick={submit} className="bg-[#0B3B82] hover:bg-[#0a3270]" data-testid="ticket-submit">Create ticket</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-4 space-y-3">
          {tickets.map(t => (
            <div key={t.id} className="p-4 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">{t.ticket_number}</span>
                    <Badge variant="outline" className="capitalize">{t.priority}</Badge>
                    <Badge variant="outline" className="capitalize">{t.category}</Badge>
                  </div>
                  <div className="mt-1 font-display font-semibold text-slate-900">{t.subject}</div>
                  <p className="text-sm text-slate-600 mt-1">{t.description}</p>
                </div>
                <Badge className={`capitalize ${t.status === 'open' ? 'bg-blue-100 text-blue-800' : t.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{t.status}</Badge>
              </div>
            </div>
          ))}
          {tickets.length === 0 && <p className="text-sm text-slate-500 text-center py-6">No tickets yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
};

// ---------- MESSAGES ----------
const Messages = () => {
  const { user } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [targetId, setTargetId] = useState(null);

  useEffect(() => {
    api.get(`/customers/${user.id}`).then(r => {
      setCustomer(r.data);
      setTargetId(r.data.assigned_technician_id);
    });
  }, [user.id]);

  useEffect(() => {
    if (!targetId) return;
    const load = () => api.get(`/messages?with_user=${targetId}`).then(r => setMessages(r.data));
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [targetId]);

  const send = async () => {
    if (!text.trim() || !targetId) return;
    await api.post('/messages', { recipient_id: targetId, content: text });
    setText('');
    api.get(`/messages?with_user=${targetId}`).then(r => setMessages(r.data));
  };

  const tech = customer?.technician;

  return (
    <Card className="border-slate-200" data-testid="customer-messages">
      <CardContent className="p-0">
        <div className="p-5 border-b border-slate-200 flex items-center gap-3">
          <Avatar className="h-10 w-10"><AvatarImage src={tech?.photo} /><AvatarFallback>{tech?.name?.[0]}</AvatarFallback></Avatar>
          <div>
            <div className="font-semibold">{tech?.name || 'Technician'}</div>
            <div className="text-xs text-slate-500">{tech?.specialization}</div>
          </div>
        </div>
        <div className="h-[50vh] overflow-y-auto p-5 space-y-3 bg-slate-50">
          {messages.map(m => (
            <div key={m.id} className={`max-w-[75%] p-3 rounded-lg text-sm ${m.sender_id === user.id ? 'ml-auto bg-[#0B3B82] text-white' : 'bg-white border border-slate-200'}`}>
              <p>{m.content}</p>
              <p className={`text-[10px] mt-1 ${m.sender_id === user.id ? 'text-blue-100' : 'text-slate-400'}`}>{new Date(m.created_at).toLocaleTimeString()}</p>
            </div>
          ))}
          {messages.length === 0 && <p className="text-center text-sm text-slate-400 py-10">No messages yet. Send your first message.</p>}
        </div>
        <div className="p-4 border-t border-slate-200 flex gap-2">
          <Input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type a message…" data-testid="message-input" />
          <Button onClick={send} className="bg-[#0B3B82] hover:bg-[#0a3270]" data-testid="send-message-btn"><Send className="h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ---------- PROFILE ----------
const Profile = () => {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '', payment_method: user?.payment_method || '' });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/auth/profile', form);
      await refresh();
      toast.success('Profile updated');
    } catch (err) { toast.error('Could not save'); } finally { setSaving(false); }
  };
  return (
    <Card className="border-slate-200" data-testid="customer-profile">
      <CardContent className="p-6 max-w-2xl">
        <h2 className="font-display font-bold text-xl">My profile</h2>
        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <div><Label>Full name</Label><Input className="mt-1.5" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} data-testid="profile-name" /></div>
          <div><Label>Email</Label><Input className="mt-1.5" value={user.email} disabled /></div>
          <div><Label>Phone</Label><Input className="mt-1.5" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} data-testid="profile-phone" /></div>
          <div className="sm:col-span-2"><Label>Address</Label><Input className="mt-1.5" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} data-testid="profile-address" /></div>
          <div className="sm:col-span-2"><Label>Payment method on file</Label><Input className="mt-1.5" placeholder="e.g. Visa ending 4242" value={form.payment_method || ''} onChange={e => setForm({ ...form, payment_method: e.target.value })} data-testid="profile-payment" /><p className="text-xs text-slate-500 mt-1">Stored as a reference only — no real card processing unless a payment gateway is configured.</p></div>
        </div>
        <Button onClick={save} disabled={saving} className="mt-5 bg-[#0B3B82] hover:bg-[#0a3270]" data-testid="profile-save-btn">{saving ? 'Saving…' : 'Save changes'}</Button>
      </CardContent>
    </Card>
  );
};

export default function CustomerDashboard() {
  return (
    <Routes>
      <Route element={<DashboardShell role="customer" />}>
        <Route index element={<Overview />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="software" element={<Software />} />
        <Route path="devices" element={<Devices />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="history" element={<History />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="messages" element={<Messages />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}
