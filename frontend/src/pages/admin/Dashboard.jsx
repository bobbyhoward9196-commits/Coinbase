import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardShell } from '../../components/DashboardShell';
import { api } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
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
  Users, Wrench, DollarSign, TicketCheck, Calendar, BookOpen, Plus, Link2,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar,
} from 'recharts';
import { toast } from 'sonner';
import SoftwareRequests from './SoftwareRequests';

const StatCard = ({ icon: Icon, label, value, tint = 'blue' }) => {
  const tints = { blue: 'bg-blue-50 text-[#0B3B82] border-blue-100', green: 'bg-green-50 text-green-700 border-green-100', amber: 'bg-amber-50 text-amber-700 border-amber-100', rose: 'bg-rose-50 text-rose-700 border-rose-100' };
  return (
    <Card className="border-slate-200">
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">{label}</div>
          <div className="mt-1 font-display font-bold text-2xl text-slate-900">{value}</div>
        </div>
        <div className={`h-10 w-10 rounded-lg border grid place-items-center ${tints[tint]}`}><Icon className="h-5 w-5" /></div>
      </CardContent>
    </Card>
  );
};

// ---------- ANALYTICS ----------
const Analytics = () => {
  const [data, setData] = useState({});
  useEffect(() => { api.get('/analytics/overview').then(r => setData(r.data)); }, []);
  return (
    <div className="space-y-6" data-testid="admin-analytics">
      <h2 className="font-display font-bold text-2xl">Analytics overview</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Customers" value={data.customers ?? 0} />
        <StatCard icon={Wrench} label="Technicians" value={data.technicians ?? 0} />
        <StatCard icon={DollarSign} label="Total revenue" value={`$${(data.revenue ?? 0).toLocaleString()}`} tint="green" />
        <StatCard icon={TicketCheck} label="Open tickets" value={data.open_tickets ?? 0} tint="amber" />
        <StatCard icon={Calendar} label="Upcoming jobs" value={data.upcoming_appointments ?? 0} />
        <StatCard icon={BookOpen} label="Bookings" value={data.bookings ?? 0} />
        <StatCard icon={DollarSign} label="Invoices" value={data.invoices ?? 0} tint="green" />
      </div>
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <h3 className="font-display font-semibold">Revenue by month</h3>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenue_by_month || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="amount" fill="#0B3B82" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ---------- CUSTOMERS ----------
const Customers = () => {
  const [rows, setRows] = useState([]);
  const [techs, setTechs] = useState([]);
  const [assignFor, setAssignFor] = useState(null);
  const [newTech, setNewTech] = useState('');
  const load = () => api.get('/customers').then(r => setRows(r.data));
  useEffect(() => { load(); api.get('/technicians').then(r => setTechs(r.data)); }, []);
  const assign = async () => {
    await api.post('/technicians/assign', { customer_id: assignFor.id, technician_id: newTech });
    toast.success('Technician assigned');
    setAssignFor(null); setNewTech(''); load();
  };
  return (
    <Card className="border-slate-200" data-testid="admin-customers">
      <CardContent className="p-6">
        <h2 className="font-display font-bold text-xl">Customers</h2>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>
              <TableHead>Plan</TableHead><TableHead>Invoices</TableHead><TableHead>Appts</TableHead>
              <TableHead>Tech</TableHead><TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => {
              const t = techs.find(t => t.id === r.assigned_technician_id);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>{r.phone}</TableCell>
                  <TableCell>{r.active_plan || '—'}</TableCell>
                  <TableCell>{r.invoice_count}</TableCell>
                  <TableCell>{r.appointment_count}</TableCell>
                  <TableCell>{t?.name || '—'}</TableCell>
                  <TableCell><Button size="sm" variant="outline" onClick={() => { setAssignFor(r); setNewTech(r.assigned_technician_id || ''); }} data-testid={`assign-${r.id}`}><Link2 className="h-3.5 w-3.5 mr-1" />Assign</Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <Dialog open={!!assignFor} onOpenChange={(v) => !v && setAssignFor(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Assign technician to {assignFor?.name}</DialogTitle></DialogHeader>
            <div>
              <Label>Technician</Label>
              <Select value={newTech} onValueChange={setNewTech}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Choose technician" /></SelectTrigger>
                <SelectContent>{techs.map(t => <SelectItem key={t.id} value={t.id}>{t.name} — {t.specialization}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <DialogFooter><Button onClick={assign} disabled={!newTech} className="bg-[#0B3B82] hover:bg-[#0a3270]">Assign</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

// ---------- TECHNICIANS ----------
const Technicians = () => {
  const [techs, setTechs] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', specialization: 'General IT' });
  const load = () => api.get('/technicians').then(r => setTechs(r.data));
  useEffect(() => { load(); }, []);
  const create = async () => {
    await api.post(`/technicians?specialization=${encodeURIComponent(form.specialization)}`, form);
    toast.success('Technician added');
    setOpen(false); setForm({ name: '', email: '', password: '', phone: '', specialization: 'General IT' });
    load();
  };
  return (
    <Card className="border-slate-200" data-testid="admin-technicians">
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <h2 className="font-display font-bold text-xl">Technicians</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-[#0B3B82] hover:bg-[#0a3270]" data-testid="add-tech-btn"><Plus className="h-4 w-4 mr-1" />Add technician</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add technician</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>Password</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Specialization</Label><Input value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={create} className="bg-[#0B3B82] hover:bg-[#0a3270]">Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Table className="mt-4">
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Specialization</TableHead><TableHead>Rating</TableHead></TableRow></TableHeader>
          <TableBody>
            {techs.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell>{t.email}</TableCell>
                <TableCell>{t.phone}</TableCell>
                <TableCell>{t.specialization}</TableCell>
                <TableCell>{t.rating}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// ---------- APPOINTMENTS (admin) ----------
const Appointments = () => {
  const [appts, setAppts] = useState([]);
  useEffect(() => { api.get('/appointments').then(r => setAppts(r.data)); }, []);
  return (
    <Card className="border-slate-200" data-testid="admin-appointments">
      <CardContent className="p-6">
        <h2 className="font-display font-bold text-xl">All appointments</h2>
        <Table className="mt-4">
          <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Technician</TableHead><TableHead>Service</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {appts.map(a => (
              <TableRow key={a.id}>
                <TableCell>{a.customer?.name}</TableCell>
                <TableCell>{a.technician?.name || '—'}</TableCell>
                <TableCell>{a.service_type}</TableCell>
                <TableCell>{new Date(a.scheduled_date).toLocaleDateString()} · {a.scheduled_time}</TableCell>
                <TableCell><Badge className={`capitalize ${a.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{a.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// ---------- INVOICES ----------
const Invoices = () => {
  const [invs, setInvs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer_id: '', amount: '', description: '', payment_method: 'Check', status: 'pending' });
  const load = () => api.get('/invoices').then(r => setInvs(r.data));
  useEffect(() => { load(); api.get('/customers').then(r => setCustomers(r.data)); }, []);
  const create = async () => {
    await api.post('/invoices', { ...form, amount: parseFloat(form.amount) });
    toast.success('Invoice created');
    setOpen(false); setForm({ customer_id: '', amount: '', description: '', payment_method: 'Check', status: 'pending' });
    load();
  };
  return (
    <Card className="border-slate-200" data-testid="admin-invoices">
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <h2 className="font-display font-bold text-xl">Invoices</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-[#0B3B82] hover:bg-[#0a3270]" data-testid="create-invoice-btn"><Plus className="h-4 w-4 mr-1" />Create invoice</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create invoice</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Customer</Label>
                  <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} — {c.email}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Amount ($)</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Method</Label>
                    <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>{['Check','Credit Card','ACH','Wire','Cash'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>{['pending','paid','overdue','cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter><Button onClick={create} disabled={!form.customer_id || !form.amount} className="bg-[#0B3B82] hover:bg-[#0a3270]">Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Table className="mt-4">
          <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Customer</TableHead><TableHead>Description</TableHead><TableHead>Date</TableHead><TableHead>Method</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {invs.map(i => (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-xs">{i.invoice_number}</TableCell>
                <TableCell>{i.customer?.name}</TableCell>
                <TableCell className="max-w-xs truncate">{i.description}</TableCell>
                <TableCell>{new Date(i.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{i.payment_method}</TableCell>
                <TableCell className="font-semibold">${i.amount?.toFixed(2)}</TableCell>
                <TableCell><Badge className={`capitalize ${i.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{i.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// ---------- PAYMENTS ----------
const Payments = () => {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get('/payments').then(r => setRows(r.data)); }, []);
  const total = rows.reduce((s, r) => s + (r.amount || 0), 0);
  return (
    <div className="space-y-6" data-testid="admin-payments">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={DollarSign} label="Total received" value={`$${total.toLocaleString()}`} tint="green" />
        <StatCard icon={DollarSign} label="Payments count" value={rows.length} />
        <StatCard icon={DollarSign} label="Avg payment" value={`$${(rows.length ? total / rows.length : 0).toFixed(2)}`} />
      </div>
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <h2 className="font-display font-bold text-xl">Payment ledger</h2>
          <Table className="mt-4">
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead>Invoice</TableHead><TableHead>Method</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.paid_at || r.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{r.customer?.name}</TableCell>
                  <TableCell className="font-mono text-xs">{r.invoice_number}</TableCell>
                  <TableCell>{r.payment_method}</TableCell>
                  <TableCell className="font-semibold">${r.amount?.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// ---------- TICKETS ----------
const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [techs, setTechs] = useState([]);
  useEffect(() => { api.get('/tickets').then(r => setTickets(r.data)); api.get('/technicians').then(r => setTechs(r.data)); }, []);
  const update = async (id, body) => { await api.patch(`/tickets/${id}`, body); api.get('/tickets').then(r => setTickets(r.data)); };
  return (
    <Card className="border-slate-200" data-testid="admin-tickets">
      <CardContent className="p-6">
        <h2 className="font-display font-bold text-xl">Support tickets</h2>
        <Table className="mt-4">
          <TableHeader><TableRow><TableHead>Ticket</TableHead><TableHead>Customer</TableHead><TableHead>Subject</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Assigned</TableHead></TableRow></TableHeader>
          <TableBody>
            {tickets.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">{t.ticket_number}</TableCell>
                <TableCell>{t.customer?.name}</TableCell>
                <TableCell className="max-w-xs truncate">{t.subject}</TableCell>
                <TableCell className="capitalize">{t.priority}</TableCell>
                <TableCell>
                  <Select value={t.status} onValueChange={(v) => update(t.id, { status: v })}>
                    <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{['open','in_progress','resolved','closed'].map(s => <SelectItem key={s} value={s}>{s.replace('_',' ')}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={t.assigned_to || ''} onValueChange={(v) => update(t.id, { assigned_to: v })}>
                    <SelectTrigger className="w-40 h-8"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>{techs.map(te => <SelectItem key={te.id} value={te.id}>{te.name}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// ---------- PLANS ----------
const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', duration: 'per month', description: '', features: '', popular: false });
  const load = () => api.get('/plans').then(r => setPlans(r.data));
  useEffect(() => { load(); }, []);
  const save = async () => {
    const body = { ...form, price: parseFloat(form.price), features: form.features.split('\n').map(s => s.trim()).filter(Boolean) };
    await api.post('/plans', body);
    toast.success('Plan created'); setOpen(false); load();
    setForm({ name: '', price: '', duration: 'per month', description: '', features: '', popular: false });
  };
  const del = async (id) => { if (!window.confirm('Delete this plan?')) return; await api.delete(`/plans/${id}`); load(); };
  return (
    <Card className="border-slate-200" data-testid="admin-plans">
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <h2 className="font-display font-bold text-xl">Plans & Pricing</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-[#0B3B82] hover:bg-[#0a3270]"><Plus className="h-4 w-4 mr-1" />New plan</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New plan</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Price</Label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
                  <div><Label>Duration</Label><Input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} /></div>
                </div>
                <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>Features (one per line)</Label><Textarea rows={4} value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={save} className="bg-[#0B3B82] hover:bg-[#0a3270]">Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map(p => (
            <Card key={p.id} className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <div className="font-display font-bold">{p.name}</div>
                  <Badge variant="outline">${p.price}/{p.duration}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">{p.description}</p>
                <ul className="mt-3 space-y-1 text-xs text-slate-700">
                  {p.features?.map((f, i) => <li key={i}>• {f}</li>)}
                </ul>
                <Button onClick={() => del(p.id)} size="sm" variant="outline" className="mt-3 text-rose-600 border-rose-200 hover:bg-rose-50">Delete</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ---------- BOOKINGS ----------
const Bookings = () => {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get('/bookings').then(r => setRows(r.data)); }, []);
  return (
    <Card className="border-slate-200" data-testid="admin-bookings">
      <CardContent className="p-6">
        <h2 className="font-display font-bold text-xl">Booking requests</h2>
        <Table className="mt-4">
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Name</TableHead><TableHead>Service</TableHead><TableHead>Urgency</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{r.contact_name}</TableCell>
                <TableCell className="max-w-xs truncate">{r.service_type}</TableCell>
                <TableCell><Badge variant={r.urgency === 'emergency' ? 'destructive' : 'outline'} className="capitalize">{r.urgency}</Badge></TableCell>
                <TableCell>{r.contact_phone}</TableCell>
                <TableCell className="capitalize">{r.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// ---------- CONTACT SUBMISSIONS ----------
const Contact = () => {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get('/contact').then(r => setRows(r.data)); }, []);
  return (
    <Card className="border-slate-200" data-testid="admin-contact">
      <CardContent className="p-6">
        <h2 className="font-display font-bold text-xl">Contact submissions</h2>
        <div className="mt-4 space-y-3">
          {rows.map(r => (
            <div key={r.id} className="p-4 rounded-lg border border-slate-200 bg-white">
              <div className="flex justify-between flex-wrap gap-2">
                <div>
                  <div className="font-semibold">{r.subject}</div>
                  <div className="text-xs text-slate-500">{r.name} · {r.email} · {r.phone}</div>
                </div>
                <div className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</div>
              </div>
              <p className="text-sm text-slate-700 mt-2">{r.message}</p>
            </div>
          ))}
          {rows.length === 0 && <p className="text-sm text-slate-500 text-center py-6">No submissions yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export default function AdminDashboard() {
  return (
    <Routes>
      <Route element={<DashboardShell role="admin" />}>
        <Route index element={<Analytics />} />
        <Route path="customers" element={<Customers />} />
        <Route path="technicians" element={<Technicians />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="payments" element={<Payments />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="software-requests" element={<SoftwareRequests />} />
        <Route path="plans" element={<Plans />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="contact" element={<Contact />} />
      </Route>
    </Routes>
  );
}
