import React, { useEffect, useState } from 'react';
import { api, API } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  FileWarning, Download, ShieldAlert, ShieldCheck, Calendar, User,
  Lock, Server, Globe, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

const SeverityBadge = ({ severity }) => {
  const map = {
    high: 'bg-amber-100 text-amber-800 border-amber-200',
    critical: 'bg-rose-100 text-rose-800 border-rose-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return <Badge variant="outline" className={`uppercase tracking-wider text-[10px] ${map[severity] || map.medium}`}>{severity}</Badge>;
};

const StatusBadge = ({ status }) => {
  const map = {
    remediated: 'bg-green-100 text-green-800 border-green-200',
    open: 'bg-rose-100 text-rose-800 border-rose-200',
    in_review: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  return <Badge variant="outline" className={`capitalize ${map[status] || map.in_review}`}>{status?.replace('_', ' ')}</Badge>;
};

export default function DiagnosticReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    api.get('/diagnostic-reports')
      .then(r => setReports(r.data))
      .catch(() => toast.error('Could not load reports'))
      .finally(() => setLoading(false));
  }, []);

  const download = async (rep) => {
    setDownloadingId(rep.id);
    try {
      const token = localStorage.getItem('gts_token');
      const res = await fetch(`${API}/diagnostic-reports/${rep.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = rep.filename || 'diagnostic-report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch (err) {
      toast.error('Failed to download report');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6" data-testid="diagnostic-reports-page">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <FileWarning className="h-5 w-5 text-amber-600" />
          <h2 className="font-display font-bold text-2xl text-slate-900">Diagnostic Reports</h2>
        </div>
        <p className="text-slate-600 text-sm mt-1">
          Confidential incident-response and remediation reports prepared by your lead technician.
        </p>
      </div>

      {/* Top callout */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-rose-50/40">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-lg bg-amber-100 border border-amber-200 grid place-items-center shrink-0">
              <ShieldAlert className="h-5 w-5 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-semibold text-slate-900">Identity-exposure incident — fully contained</h3>
                <Badge className="bg-green-600 hover:bg-green-600 text-white">Remediated</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                Our security operations team identified instances where your personal information had been listed on dark-web markets.
                The hostile source has been destroyed, the credit bureaus, SSA, and federal authorities were notified, and your devices
                are now protected behind a Microsoft-provisioned dedicated security node masking your IP for 12 months at 1.5 Gbps.
              </p>
              <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-700"><Server className="h-4 w-4 text-rose-600" /> Compromised server destroyed</div>
                <div className="flex items-center gap-2 text-sm text-slate-700"><User className="h-4 w-4 text-blue-700" /> Bureaus & SSA notified</div>
                <div className="flex items-center gap-2 text-sm text-slate-700"><Lock className="h-4 w-4 text-emerald-600" /> IP encrypted & masked</div>
                <div className="flex items-center gap-2 text-sm text-slate-700"><Globe className="h-4 w-4 text-[#0B3B82]" /> Microsoft secure node active</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports list */}
      {loading ? (
        <Card className="border-slate-200"><CardContent className="p-8 text-center text-sm text-slate-500">Loading reports…</CardContent></Card>
      ) : reports.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-10 text-center">
            <ShieldCheck className="h-12 w-12 mx-auto text-emerald-500" />
            <h3 className="mt-3 font-display font-semibold text-lg">All clear</h3>
            <p className="mt-1 text-sm text-slate-500">No diagnostic reports on file. We'll notify you here if anything is detected.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((rep) => (
            <Card key={rep.id} className="border-slate-200" data-testid={`report-card-${rep.id}`}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-5 lg:gap-8">
                  {/* Left: report info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <SeverityBadge severity={rep.severity} />
                      <StatusBadge status={rep.status} />
                      <span className="text-xs font-mono text-slate-500">{rep.incident_id}</span>
                    </div>
                    <h3 className="mt-2 font-display font-semibold text-lg text-slate-900 leading-tight">{rep.title}</h3>
                    {rep.summary && <p className="mt-2 text-sm text-slate-600 leading-relaxed">{rep.summary}</p>}

                    <div className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-slate-500">Issued</span>
                        <span className="font-medium text-slate-900">{new Date(rep.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-slate-500">Issued by</span>
                        <span className="font-medium text-slate-900">{rep.issued_by}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <FileWarning className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-slate-500">Pages</span>
                        <span className="font-medium text-slate-900">{rep.pages || 4}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-slate-500">Customer action</span>
                        <span className="font-medium text-emerald-700">None required</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: download */}
                  <div className="lg:w-56 lg:shrink-0">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">PDF · Confidential</div>
                      <div className="mt-1 font-display font-bold text-slate-900">{rep.pages || 4}-page report</div>
                      <Button
                        onClick={() => download(rep)}
                        disabled={downloadingId === rep.id}
                        className="mt-3 w-full bg-[#0B3B82] hover:bg-[#0a3270]"
                        data-testid={`download-report-${rep.id}`}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {downloadingId === rep.id ? 'Preparing…' : 'Download'}
                      </Button>
                      <p className="mt-2 text-[10px] text-slate-500 leading-relaxed">
                        For the named recipient only. Do not forward.
                      </p>
                    </div>
                  </div>
                </div>

                {/* What's inside the report */}
                <div className="mt-5 pt-5 border-t border-slate-100 grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { icon: AlertTriangle, label: 'Findings inventory', desc: 'Hashed evidence of every dark-web listing' },
                    { icon: Server, label: 'Containment timeline', desc: 'Step-by-step actions taken on your behalf' },
                    { icon: Globe, label: 'Microsoft node diagram', desc: 'How your traffic is now masked & routed' },
                    { icon: Lock, label: 'Forward-looking protections', desc: '12-month managed VIP coverage' },
                  ].map((it, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-sm">
                      <it.icon className="h-4 w-4 text-[#0B3B82] mt-0.5 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900 text-xs">{it.label}</div>
                        <div className="text-xs text-slate-500 leading-relaxed">{it.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
