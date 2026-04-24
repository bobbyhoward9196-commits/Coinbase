import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
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
import { Users, Calendar, CheckCircle2, TicketCheck, Send, FileText, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const StatCard = ({ icon: Icon, label, value, tint = 'blue' }) => {
  const tints = { blue: 'bg-blue-50 text-[#0B3B82] border-blue-100', green: 'bg-green-50 text-green-700 border-green-100', amber: 'bg-amber-50 text-amber-700 border-amber-100' };
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

const Overview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [appts, setAppts] = useState([]);
  useEffect(() => {
    Promise.all([api.get('/dashboard/stats'), api.get('/appointments')]).then(([s, a]) => {
      setStats(s.data); setAppts(a.data);
    });
  }, []);
  return (
    <div className="space-y-6" data-testid="tech-overview">
      <div>
        <h2 className="font-display font-bold text-2xl text-slate-900">Hey {user.name.split(' ')[0]}.</h2>
        <p className="text-slate-600 text-sm mt-1">Here's your day at a glance.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Assigned customers" value={stats.assigned_customers ?? 0} />
        <StatCard icon={Calendar} label="Upcoming jobs" value={stats.upcoming_appointments ?? 0} tint="amber" />
        <StatCard icon={CheckCircle2} label="Completed jobs" value={stats.completed_jobs ?? 0} tint="green" />
        <StatCard icon={TicketCheck} label="Open tickets" value={stats.open_tickets ?? 0} tint="amber" />
      </div>
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <h3 className="font-display font-semibold">Today's & upcoming schedule</h3>
          <Table className="mt-3">
            <TableHeader>
              <TableRow><TableHead>Customer</TableHead><TableHead>Service</TableHead><TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead>Status</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {appts.filter(a => a.status !== 'completed').slice(0, 6).map(a => (
                <TableRow key={a.id}>
                  <TableCell>{a.customer?.name}</TableCell>
                  <TableCell>{a.service_type}</TableCell>
                  <TableCell>{new Date(a.scheduled_date).toLocaleDateString()}</TableCell>
                  <TableCell>{a.scheduled_time}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{a.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const MyCustomers = () => {
  const [customers, setCustomers] = useState([]);
  useEffect(() => {
    api.get('/appointments').then(r => {
      const unique = {};
      r.data.forEach(a => { if (a.customer) unique[a.customer_id] = a.customer; });
      setCustomers(Object.values(unique));
    });
  }, []);
  return (
    <Card className="border-slate-200" data-testid="tech-customers">
      <CardContent className="p-6">
        <h2 className="font-display font-bold text-xl">My customers</h2>
        <Table className="mt-4">
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Address</TableHead></TableRow></TableHeader>
          <TableBody>
            {customers.map((c, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell className="max-w-xs truncate">{c.address}</TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-slate-500 py-6">No customers assigned yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const Schedule = () => {
  const [appts, setAppts] = useState([]);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ status: '', notes: '', report: '' });
  const load = () => api.get('/appointments').then(r => setAppts(r.data));
  useEffect(() => { load(); }, []);
  const openEdit = (a) => { setEdit(a); setForm({ status: a.status, notes: a.notes || '', report: a.report || '' }); };
  const save = async () => {
    await api.patch(`/appointments/${edit.id}`, form);
    toast.success('Appointment updated');
    setEdit(null); load();
  };
  return (
    <Card className="border-slate-200" data-testid="tech-schedule">
      <CardContent className="p-6">
        <h2 className="font-display font-bold text-xl">My schedule</h2>
        <Table className="mt-4">
          <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Service</TableHead><TableHead>Date/Time</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {appts.map(a => (
              <TableRow key={a.id}>
                <TableCell>{a.customer?.name}</TableCell>
                <TableCell className="max-w-[220px] truncate">{a.service_type}</TableCell>
                <TableCell>{new Date(a.scheduled_date).toLocaleDateString()} · {a.scheduled_time}</TableCell>
                <TableCell><Badge className={`capitalize ${a.status === 'completed' ? 'bg-green-100 text-green-800' : a.status === 'in_progress' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{a.status}</Badge></TableCell>
                <TableCell><Button size="sm" variant="outline" onClick={() => openEdit(a)} data-testid={`update-appt-${a.id}`}>Update</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Update appointment</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['scheduled','in_progress','completed','cancelled'].map(s => <SelectItem key={s} value={s}>{s.replace('_',' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Service notes</Label><Textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="What did you do?" data-testid="appt-notes" /></div>
              <div><Label>Report / findings</Label><Textarea rows={4} value={form.report} onChange={e => setForm({ ...form, report: e.target.value })} placeholder="Full report (visible to admin & customer)." data-testid="appt-report" /></div>
            </div>
            <DialogFooter><Button onClick={save} className="bg-[#0B3B82] hover:bg-[#0a3270]" data-testid="appt-save">Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  useEffect(() => { api.get('/tickets').then(r => setTickets(r.data)); }, []);
  const updateStatus = async (id, status) => {
    await api.patch(`/tickets/${id}`, { status });
    toast.success('Updated');
    api.get('/tickets').then(r => setTickets(r.data));
  };
  return (
    <Card className="border-slate-200" data-testid="tech-tickets">
      <CardContent className="p-6">
        <h2 className="font-display font-bold text-xl">Assigned tickets</h2>
        <div className="mt-4 space-y-3">
          {tickets.map(t => (
            <div key={t.id} className="p-4 rounded-lg border border-slate-200 bg-white">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">{t.ticket_number}</span>
                    <Badge variant="outline" className="capitalize">{t.priority}</Badge>
                  </div>
                  <div className="font-display font-semibold mt-1">{t.subject}</div>
                  <p className="text-sm text-slate-600 mt-1">{t.description}</p>
                  <p className="text-xs text-slate-500 mt-2">From: <span className="font-medium">{t.customer?.name}</span></p>
                </div>
                <Select value={t.status} onValueChange={(v) => updateStatus(t.id, v)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['open','in_progress','resolved','closed'].map(s => <SelectItem key={s} value={s}>{s.replace('_',' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          {tickets.length === 0 && <p className="text-sm text-slate-500 text-center py-6">No tickets assigned.</p>}
        </div>
      </CardContent>
    </Card>
  );
};

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    api.get('/conversations').then(r => setConversations(r.data));
    api.get('/appointments').then(r => {
      const unique = {};
      r.data.forEach(a => { if (a.customer) unique[a.customer_id] = a.customer; });
      setCustomers(Object.entries(unique).map(([id, c]) => ({ id, ...c })));
    });
  }, []);

  useEffect(() => {
    if (!activeId) return;
    const load = () => api.get(`/messages?with_user=${activeId}`).then(r => setMessages(r.data));
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [activeId]);

  const send = async () => {
    if (!text.trim() || !activeId) return;
    await api.post('/messages', { recipient_id: activeId, content: text });
    setText('');
    api.get(`/messages?with_user=${activeId}`).then(r => setMessages(r.data));
  };

  const active = customers.find(c => c.id === activeId) || conversations.find(c => c.user_id === activeId)?.user;

  return (
    <Card className="border-slate-200" data-testid="tech-messages">
      <CardContent className="p-0 grid grid-cols-1 md:grid-cols-3 min-h-[60vh]">
        <div className="border-r border-slate-200">
          <div className="p-4 border-b border-slate-200 font-display font-semibold">Customers</div>
          <div className="divide-y divide-slate-100">
            {customers.map(c => (
              <button key={c.id} onClick={() => setActiveId(c.id)} className={`w-full text-left px-4 py-3 hover:bg-slate-50 ${activeId === c.id ? 'bg-blue-50' : ''}`} data-testid={`tech-conv-${c.id}`}>
                <div className="text-sm font-medium text-slate-900">{c.name}</div>
                <div className="text-xs text-slate-500 truncate">{c.email}</div>
              </button>
            ))}
            {customers.length === 0 && <p className="p-4 text-sm text-slate-500">No customers yet.</p>}
          </div>
        </div>
        <div className="md:col-span-2 flex flex-col">
          {activeId ? (
            <>
              <div className="p-4 border-b border-slate-200">
                <div className="font-semibold">{active?.name}</div>
                <div className="text-xs text-slate-500">{active?.email}</div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {messages.map(m => (
                  <div key={m.id} className={`max-w-[75%] p-3 rounded-lg text-sm ${m.sender_id === user.id ? 'ml-auto bg-[#0B3B82] text-white' : 'bg-white border border-slate-200'}`}>
                    <p>{m.content}</p>
                    <p className={`text-[10px] mt-1 ${m.sender_id === user.id ? 'text-blue-100' : 'text-slate-400'}`}>{new Date(m.created_at).toLocaleTimeString()}</p>
                  </div>
                ))}
                {messages.length === 0 && <p className="text-center text-slate-400 text-sm py-10">No messages yet.</p>}
              </div>
              <div className="p-3 border-t flex gap-2">
                <Input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Message…" data-testid="tech-msg-input" />
                <Button onClick={send} className="bg-[#0B3B82] hover:bg-[#0a3270]" data-testid="tech-msg-send"><Send className="h-4 w-4" /></Button>
              </div>
            </>
          ) : <div className="flex-1 grid place-items-center text-sm text-slate-500"><div className="text-center"><MessageSquare className="h-10 w-10 mx-auto text-slate-300" /><p className="mt-2">Select a customer to start chatting.</p></div></div>}
        </div>
      </CardContent>
    </Card>
  );
};

export default function TechnicianDashboard() {
  return (
    <Routes>
      <Route element={<DashboardShell role="technician" />}>
        <Route index element={<Overview />} />
        <Route path="customers" element={<MyCustomers />} />
        <Route path="appointments" element={<Schedule />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="messages" element={<Messages />} />
      </Route>
    </Routes>
  );
}
