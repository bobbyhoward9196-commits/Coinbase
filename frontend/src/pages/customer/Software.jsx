import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import {
  Sparkles, Wand2, Code2, Zap, Receipt, Briefcase, Users, Globe,
  ShieldCheck, HardDrive, Package, Search, CheckCircle2, Clock, XCircle, Send, MessageSquare, Gift
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const iconMap = { Sparkles, Wand2, Code2, Zap, Receipt, Briefcase, Users, Globe, ShieldCheck, HardDrive, Package };

const statusColors = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  under_review: 'bg-blue-100 text-blue-800 border-blue-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  denied: 'bg-rose-100 text-rose-800 border-rose-200',
};
const statusIcon = {
  pending: Clock, under_review: Clock, approved: CheckCircle2, delivered: CheckCircle2, denied: XCircle,
};

// Logo image component with graceful fallback to lucide icon
const SoftwareLogo = ({ item, size = 40 }) => {
  const [errored, setErrored] = useState(false);
  const Icon = iconMap[item.icon] || Package;

  if (errored || !item.logo_domain) {
    return (
      <div className="rounded-lg bg-blue-50 border border-blue-100 grid place-items-center flex-shrink-0" style={{ height: size, width: size }}>
        <Icon className="text-[#0B3B82]" style={{ height: size * 0.55, width: size * 0.55 }} />
      </div>
    );
  }
  return (
    <div className="rounded-lg bg-white border border-slate-200 grid place-items-center flex-shrink-0 overflow-hidden" style={{ height: size, width: size }}>
      <img
        src={`https://www.google.com/s2/favicons?domain=${item.logo_domain}&sz=128`}
        alt={item.name}
        onError={() => setErrored(true)}
        className="object-contain"
        style={{ height: size * 0.7, width: size * 0.7 }}
      />
    </div>
  );
};

export default function CustomerSoftware() {
  const [catalog, setCatalog] = useState([]);
  const [requests, setRequests] = useState([]);
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [selected, setSelected] = useState(null);
  const [reqForm, setReqForm] = useState({ quantity: 1, reason: '' });

  const load = () => {
    api.get('/software-catalog').then(r => setCatalog(r.data));
    api.get('/software-requests').then(r => setRequests(r.data));
  };
  useEffect(() => { load(); }, []);

  const categories = ['all', ...Array.from(new Set(catalog.map(c => c.category)))];
  const filtered = catalog.filter(c =>
    (activeCat === 'all' || c.category === activeCat) &&
    (!query || c.name.toLowerCase().includes(query.toLowerCase()) || c.description.toLowerCase().includes(query.toLowerCase()))
  );

  const gifts = requests.filter(r => r.is_gift);
  const userRequests = requests.filter(r => !r.is_gift);
  const activeReq = (softwareId) => requests.find(r => r.software_id === softwareId && ['pending','under_review','approved','delivered'].includes(r.status));

  const openRequest = (item) => { setSelected(item); setReqForm({ quantity: 1, reason: '' }); };
  const submitRequest = async () => {
    try {
      await api.post('/software-requests', { software_id: selected.id, quantity: parseInt(reqForm.quantity) || 1, reason: reqForm.reason });
      toast.success('Request submitted — your advisor will follow up shortly.');
      setSelected(null); load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit request');
    }
  };

  return (
    <div className="space-y-6" data-testid="customer-software">
      <div>
        <h2 className="font-display font-bold text-2xl text-slate-900">Software & subscriptions</h2>
        <p className="text-slate-600 text-sm mt-1">
          Premium software included with your plan — QuickBooks, TurboTax, ChatGPT, Claude, Microsoft 365, website development, and more.
          Request any item and your advisor will provision it for you.
        </p>
      </div>

      {/* Loyalty gifts */}
      {gifts.length > 0 && (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white" data-testid="loyalty-gifts-section">
          <CardContent className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-lg bg-emerald-100 border border-emerald-200 grid place-items-center">
                  <Gift className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900">Your loyalty gift bundle</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Granted by Global Tech Solutions as a thank-you for your continued trust · delivered {gifts[0]?.gifted_at ? new Date(gifts[0].gifted_at).toLocaleDateString() : 'recently'}.
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">{gifts.length} subscriptions included</Badge>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {gifts.map(g => {
                const sw = catalog.find(c => c.id === g.software_id);
                const display = sw || { name: g.software_name, icon: 'Package', logo_domain: null, category: g.software_category };
                return (
                  <div key={g.id} className="rounded-lg border border-emerald-200 bg-white p-3 flex items-center gap-3" data-testid={`gift-${g.id}`}>
                    <SoftwareLogo item={display} size={38} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-900 truncate">{g.software_name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{g.software_provider}</div>
                    </div>
                    <Gift className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
            {gifts[0]?.advisor_notes && (
              <p className="mt-5 text-sm text-slate-700 p-3 rounded-md bg-white border border-emerald-200 italic">
                {gifts[0].advisor_notes}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filter bar */}
      <Card className="border-slate-200">
        <CardContent className="p-5">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search software…" className="pl-9" data-testid="software-search" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setActiveCat(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeCat === c ? 'bg-[#0B3B82] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  data-testid={`cat-filter-${c}`}
                >
                  {c === 'all' ? 'All' : c}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(item => {
          const req = activeReq(item.id);
          const isGifted = req?.is_gift;
          return (
            <Card key={item.id} className="border-slate-200 gts-card-hover flex flex-col" data-testid={`software-${item.name.toLowerCase().replace(/\s/g,'-')}`}>
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-start gap-3">
                  <SoftwareLogo item={item} size={44} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-semibold text-slate-900 leading-tight">{item.name}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">{item.provider}</div>
                  </div>
                </div>
                <Badge variant="outline" className="mt-3 self-start text-[10px]">{item.category}</Badge>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed flex-1">{item.description}</p>
                <ul className="mt-3 space-y-1">
                  {item.highlights?.slice(0, 3).map((h, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" /> {h}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-500 flex-1">{item.price_note}</div>
                  {isGifted ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><Gift className="h-3 w-3 mr-1" /> Gifted</Badge>
                  ) : req ? (
                    <Badge className={statusColors[req.status]}>
                      {React.createElement(statusIcon[req.status], { className: 'h-3 w-3 mr-1' })}
                      {req.status.replace('_', ' ')}
                    </Badge>
                  ) : (
                    <Button size="sm" onClick={() => openRequest(item)} className="bg-[#0B3B82] hover:bg-[#0a3270]" data-testid={`request-${item.id}`}>
                      <Send className="h-3.5 w-3.5 mr-1" /> Request
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* My requests — only shows non-gift requests */}
      <Card className="border-slate-200" id="my-requests">
        <CardContent className="p-6">
          <h3 className="font-display font-bold text-xl">My software requests</h3>
          <div className="mt-4 space-y-3">
            {userRequests.map(r => {
              const StatusIcon = statusIcon[r.status] || Clock;
              const sw = catalog.find(c => c.id === r.software_id);
              return (
                <div key={r.id} className="p-4 rounded-lg border border-slate-200 bg-white flex gap-4" data-testid={`my-request-${r.id}`}>
                  <SoftwareLogo item={sw || { name: r.software_name, icon: 'Package' }} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-slate-500">{r.request_number}</span>
                      <Badge variant="outline" className="text-[10px]">{r.software_category}</Badge>
                    </div>
                    <div className="font-display font-semibold text-slate-900 mt-1">{r.software_name}</div>
                    <div className="text-xs text-slate-500">{r.software_provider} · Qty: {r.quantity}</div>
                    {r.reason && <p className="text-sm text-slate-600 mt-2 italic">"{r.reason}"</p>}
                    {r.advisor_notes && (
                      <div className="mt-2 p-2 rounded bg-blue-50 border border-blue-100 text-xs text-slate-700">
                        <strong>Advisor note:</strong> {r.advisor_notes}
                      </div>
                    )}
                  </div>
                  <Badge className={statusColors[r.status]}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {r.status.replace('_', ' ')}
                  </Badge>
                </div>
              );
            })}
            {userRequests.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-6">
                You haven't requested any software yet. Browse the catalog above and click <strong>Request</strong> on any item.
              </p>
            )}
          </div>
          <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 flex gap-3">
            <MessageSquare className="h-5 w-5 text-[#0B3B82] flex-shrink-0" />
            <div className="flex-1 text-sm">
              <div className="font-semibold text-slate-900">Need something not listed?</div>
              <p className="text-slate-600 mt-0.5">Chat with your advisor and we'll source any premium software or subscription for you.</p>
            </div>
            <Button asChild size="sm" variant="outline" className="border-[#0B3B82] text-[#0B3B82]">
              <Link to="/dashboard/messages">Message advisor</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Request dialog */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Request {selected.name}</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <SoftwareLogo item={selected} size={48} />
                <div>
                  <div className="font-semibold text-slate-900">{selected.name}</div>
                  <div className="text-xs text-slate-500">{selected.provider}</div>
                </div>
              </div>
              <p className="text-sm text-slate-600">{selected.description}</p>
              <p className="text-xs text-slate-500">{selected.price_note}</p>
              <div className="space-y-3 mt-2">
                <div><Label>Quantity / seats</Label><Input type="number" min="1" value={reqForm.quantity} onChange={e => setReqForm({ ...reqForm, quantity: e.target.value })} className="mt-1.5" data-testid="request-quantity" /></div>
                <div><Label>Why do you need it? (optional)</Label><Textarea rows={3} value={reqForm.reason} onChange={e => setReqForm({ ...reqForm, reason: e.target.value })} placeholder="e.g., Need for 2026 tax year" className="mt-1.5" data-testid="request-reason" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
                <Button onClick={submitRequest} className="bg-[#0B3B82] hover:bg-[#0a3270]" data-testid="request-submit">Submit request</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
