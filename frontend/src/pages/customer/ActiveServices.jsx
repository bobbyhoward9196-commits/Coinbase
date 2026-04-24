import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import {
  Shield, ShieldCheck, Calendar, Package, Sparkles, Monitor, Phone,
  MessageSquare, Crown, CheckCircle2, Clock, FileText, Star
} from 'lucide-react';

const SoftwareLogo = ({ domain, icon: Icon = Package, size = 32 }) => {
  const [err, setErr] = useState(false);
  if (err || !domain) {
    return (
      <div className="rounded-md bg-blue-50 border border-blue-100 grid place-items-center flex-shrink-0" style={{ height: size, width: size }}>
        <Icon className="text-[#0B3B82]" style={{ height: size * 0.6, width: size * 0.6 }} />
      </div>
    );
  }
  return (
    <div className="rounded-md bg-white border border-slate-200 grid place-items-center flex-shrink-0 overflow-hidden" style={{ height: size, width: size }}>
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
        alt=""
        onError={() => setErr(true)}
        className="object-contain"
        style={{ height: size * 0.65, width: size * 0.65 }}
      />
    </div>
  );
};

export default function ActiveServices() {
  const { user } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [appts, setAppts] = useState([]);
  const [devices, setDevices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [allowance, setAllowance] = useState({ allowance: 0, used: 0, remaining: 0 });

  useEffect(() => {
    Promise.all([
      api.get(`/customers/${user.id}`),
      api.get('/appointments'),
      api.get('/devices'),
      api.get('/software-requests'),
      api.get('/software-catalog'),
      api.get('/tickets'),
      api.get('/software-gifts/allowance').catch(() => ({ data: { allowance: 0, used: 0, remaining: 0 } })),
    ]).then(([c, a, d, sr, sc, t, al]) => {
      setCustomer(c.data); setAppts(a.data); setDevices(d.data);
      setRequests(sr.data); setCatalog(sc.data); setTickets(t.data); setAllowance(al.data);
    });
  }, [user.id]);

  const tech = customer?.technician;
  const upcoming = appts.filter(a => a.status === 'scheduled');
  const inProgress = appts.filter(a => a.status === 'in_progress');
  const openTickets = tickets.filter(t => ['open', 'in_progress'].includes(t.status));
  const activeSoftware = requests.filter(r => ['delivered', 'approved'].includes(r.status));

  const findCat = (id) => catalog.find(c => c.id === id);

  return (
    <div className="space-y-6" data-testid="customer-active-services">
      <div>
        <h2 className="font-display font-bold text-2xl text-slate-900">Active tech services</h2>
        <p className="text-slate-600 text-sm mt-1">
          Everything currently running on your Global Tech Solutions account — plan, technician, software, devices, appointments, and monitoring.
        </p>
      </div>

      {/* Plan card */}
      <Card className={customer?.active_plan?.toLowerCase().includes('vip') ? 'relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-[#0B3B82] text-white border-amber-400/40' : 'border-slate-200'} data-testid="active-plan-card">
        <CardContent className="p-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-xl grid place-items-center flex-shrink-0 ${customer?.active_plan?.toLowerCase().includes('vip') ? 'bg-amber-400/20 border border-amber-400/40' : 'bg-blue-50 border border-blue-100'}`}>
                {customer?.active_plan?.toLowerCase().includes('vip') ? <Crown className="h-6 w-6 text-amber-300" /> : <Shield className="h-6 w-6 text-[#0B3B82]" />}
              </div>
              <div>
                <div className={`text-xs uppercase tracking-wider ${customer?.active_plan?.toLowerCase().includes('vip') ? 'text-amber-300' : 'text-slate-500'}`}>Active plan</div>
                <div className={`font-display font-bold text-xl ${customer?.active_plan?.toLowerCase().includes('vip') ? 'text-white' : 'text-slate-900'}`}>{customer?.active_plan || 'No plan'}</div>
                {customer?.customer_since && <div className={`text-xs mt-0.5 ${customer?.active_plan?.toLowerCase().includes('vip') ? 'text-slate-300' : 'text-slate-500'}`}>Customer since {customer.customer_since}</div>}
              </div>
            </div>
            <Badge className={customer?.active_plan?.toLowerCase().includes('vip') ? 'bg-amber-400 text-slate-950' : 'bg-green-100 text-green-800 border-green-200'}>
              <CheckCircle2 className="h-3 w-3 mr-1" /> Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Technician — with call / chat buttons */}
      {tech && (
        <Card className="border-slate-200" data-testid="active-tech-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 flex-wrap">
              <Avatar className="h-16 w-16 border border-slate-200">
                <AvatarImage src={tech.photo} />
                <AvatarFallback>{tech.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-xs uppercase tracking-wider text-slate-500">Your dedicated technician</div>
                <div className="font-display font-bold text-lg text-slate-900 mt-0.5">{tech.name}</div>
                <div className="text-sm text-slate-600">{tech.specialization}</div>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                  {tech.certification && <span><strong className="text-slate-700">{tech.certification}</strong></span>}
                  {tech.level && <span>· {tech.level}</span>}
                  {tech.joined_year && <span>· Since {tech.joined_year}</span>}
                  <span className="flex items-center gap-0.5">· {tech.rating} <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" /></span>
                </div>
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="call-tech-btn">
                <a href={`tel:${(tech.phone || '').replace(/[^\d+]/g, '')}`}>
                  <Phone className="h-4 w-4 mr-2" /> Call {tech.name.split(' ')[0]} · {tech.phone}
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-[#0B3B82] text-[#0B3B82]" data-testid="message-tech-btn">
                <Link to="/dashboard/messages">
                  <MessageSquare className="h-4 w-4 mr-2" /> Send message
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200" data-testid="stat-appointments">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Upcoming appointments</div>
              <div className="font-display font-bold text-2xl text-slate-900 mt-1">{upcoming.length}</div>
            </div>
            <Calendar className="h-8 w-8 text-[#0B3B82]" />
          </CardContent>
        </Card>
        <Card className="border-slate-200" data-testid="stat-software">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Active software</div>
              <div className="font-display font-bold text-2xl text-slate-900 mt-1">{activeSoftware.length}</div>
            </div>
            <Sparkles className="h-8 w-8 text-[#0B3B82]" />
          </CardContent>
        </Card>
        <Card className="border-slate-200" data-testid="stat-devices">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Registered devices</div>
              <div className="font-display font-bold text-2xl text-slate-900 mt-1">{devices.length}</div>
            </div>
            <Monitor className="h-8 w-8 text-[#0B3B82]" />
          </CardContent>
        </Card>
        <Card className="border-slate-200" data-testid="stat-tickets">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Open tickets</div>
              <div className="font-display font-bold text-2xl text-slate-900 mt-1">{openTickets.length}</div>
            </div>
            <FileText className="h-8 w-8 text-amber-600" />
          </CardContent>
        </Card>
      </div>

      {/* Upcoming appointments */}
      {(upcoming.length > 0 || inProgress.length > 0) && (
        <Card className="border-slate-200" data-testid="active-appts-card">
          <CardContent className="p-6">
            <h3 className="font-display font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#0B3B82]" /> Scheduled & in-progress services
            </h3>
            <div className="mt-4 divide-y divide-slate-100">
              {[...inProgress, ...upcoming].map(a => (
                <div key={a.id} className="py-3 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{a.service_type}</div>
                    <div className="text-xs text-slate-500">{new Date(a.scheduled_date).toLocaleDateString()} · {a.scheduled_time} · {a.technician?.name}</div>
                  </div>
                  <Badge className={a.status === 'in_progress' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-100 text-blue-800 border-blue-200'}>
                    <Clock className="h-3 w-3 mr-1" /> {a.status === 'in_progress' ? 'In progress' : 'Scheduled'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active software subscriptions */}
      <Card className="border-slate-200" data-testid="active-software-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-display font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#0B3B82]" /> Active software & subscriptions
            </h3>
            {allowance.allowance > 0 && (
              <Badge variant="outline" className="border-emerald-200 text-emerald-800 bg-emerald-50">
                {allowance.remaining} gift{allowance.remaining === 1 ? '' : 's'} remaining of {allowance.allowance}
              </Badge>
            )}
          </div>
          {activeSoftware.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 text-center py-6">
              No active software yet. <Link to="/dashboard/software" className="text-[#0B3B82] font-medium">Browse the catalog →</Link>
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeSoftware.map(r => {
                const sw = findCat(r.software_id);
                return (
                  <div key={r.id} className="rounded-lg border border-slate-200 p-3 flex items-center gap-3" data-testid={`active-sw-${r.id}`}>
                    <SoftwareLogo domain={sw?.logo_domain} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{r.software_name}</div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {r.is_gift ? '🎁 Loyalty gift' : 'Approved request'} · {new Date(r.gifted_at || r.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    {r.is_gift && <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security monitoring */}
      <Card className="border-slate-200" data-testid="security-monitoring-card">
        <CardContent className="p-6">
          <h3 className="font-display font-semibold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#0B3B82]" /> Cyber security status
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: '24/7 Threat monitoring', value: 'Active', icon: ShieldCheck },
              { label: 'Managed endpoint AV', value: `${devices.length} device${devices.length === 1 ? '' : 's'}`, icon: Monitor },
              { label: 'Firewall (SonicWall)', value: 'Active', icon: Shield },
              { label: 'Dark-web monitoring', value: 'Active', icon: ShieldCheck },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
                <div className="h-8 w-8 rounded-md bg-emerald-100 border border-emerald-200 grid place-items-center flex-shrink-0">
                  <s.icon className="h-4 w-4 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-slate-600">{s.label}</div>
                  <div className="text-sm font-semibold text-emerald-800">{s.value}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Devices */}
      {devices.length > 0 && (
        <Card className="border-slate-200" data-testid="active-devices-card">
          <CardContent className="p-6">
            <h3 className="font-display font-semibold text-slate-900 flex items-center gap-2">
              <Monitor className="h-4 w-4 text-[#0B3B82]" /> Registered devices ({devices.length})
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {devices.map(d => (
                <div key={d.id} className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="text-sm font-semibold text-slate-900">{d.name}</div>
                  <div className="text-xs text-slate-500">{d.manufacturer} {d.model}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{d.os}</div>
                </div>
              ))}
            </div>
            <Button asChild size="sm" variant="outline" className="mt-4"><Link to="/dashboard/devices">Manage devices →</Link></Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
