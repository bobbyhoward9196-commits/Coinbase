import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  ShieldCheck, ShieldAlert, Shield, Lock, Globe, AlertTriangle, CheckCircle2,
  XCircle, RefreshCw, Search, Fingerprint, Wifi, Monitor, MapPin, Link as LinkIcon,
  ShieldOff, Info, Clock
} from 'lucide-react';
import { toast } from 'sonner';

// ===== Client-side browser checks =====
async function runBrowserChecks(publicIp) {
  const checks = [];
  const nav = navigator;

  // Secure context
  checks.push({
    id: 'secure-context',
    label: 'Secure context',
    icon: Lock,
    status: window.isSecureContext ? 'pass' : 'fail',
    detail: window.isSecureContext
      ? 'Page loaded over HTTPS with valid certificate.'
      : 'Page is NOT in a secure context. Do not continue.',
  });

  // HTTPS on current page
  checks.push({
    id: 'page-https',
    label: 'Current page protocol',
    icon: Globe,
    status: location.protocol === 'https:' ? 'pass' : 'fail',
    detail: `Protocol: ${location.protocol}`,
  });

  // Cookies enabled
  checks.push({
    id: 'cookies',
    label: 'Cookies enabled',
    icon: Info,
    status: nav.cookieEnabled ? 'pass' : 'warn',
    detail: nav.cookieEnabled ? 'Cookies are enabled (needed for login).' : 'Cookies are disabled — most financial sites will not work.',
  });

  // localStorage availability
  let storageOk = false;
  try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); storageOk = true; } catch {}
  checks.push({
    id: 'storage',
    label: 'Browser storage',
    icon: Info,
    status: storageOk ? 'pass' : 'warn',
    detail: storageOk ? 'localStorage available.' : 'localStorage is blocked — private browsing or restrictive mode.',
  });

  // Browser version detection (best-effort)
  const ua = nav.userAgent;
  let browser = 'Unknown', version = 0, minVersion = 0;
  const match = (re) => { const m = ua.match(re); return m ? parseInt(m[1], 10) : 0; };
  if (/Edg\/(\d+)/.test(ua)) { browser = 'Edge'; version = match(/Edg\/(\d+)/); minVersion = 125; }
  else if (/Chrome\/(\d+)/.test(ua)) { browser = 'Chrome'; version = match(/Chrome\/(\d+)/); minVersion = 125; }
  else if (/Firefox\/(\d+)/.test(ua)) { browser = 'Firefox'; version = match(/Firefox\/(\d+)/); minVersion = 128; }
  else if (/Version\/(\d+).*Safari/.test(ua)) { browser = 'Safari'; version = match(/Version\/(\d+)/); minVersion = 17; }

  checks.push({
    id: 'browser-version',
    label: 'Browser up-to-date',
    icon: Shield,
    status: version === 0 ? 'warn' : version >= minVersion ? 'pass' : 'warn',
    detail: version === 0
      ? `Could not detect browser version. (${ua.slice(0, 80)})`
      : version >= minVersion
        ? `${browser} ${version} — up to date.`
        : `${browser} ${version} — update to latest (${minVersion}+) for security patches.`,
  });

  // Do Not Track
  checks.push({
    id: 'dnt',
    label: 'Do Not Track signal',
    icon: ShieldOff,
    status: (nav.doNotTrack === '1' || window.doNotTrack === '1') ? 'pass' : 'warn',
    detail: (nav.doNotTrack === '1' || window.doNotTrack === '1')
      ? 'Do Not Track header is set — better privacy posture.'
      : 'Do Not Track is OFF. Consider enabling it in browser settings.',
  });

  // WebRTC leak detection
  const leak = await new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      const ips = [];
      pc.onicecandidate = (e) => {
        if (!e.candidate) {
          pc.close();
          resolve(ips);
        } else {
          const m = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9:]+:[a-f0-9:]+)/i.exec(e.candidate.candidate);
          if (m && !ips.includes(m[1])) ips.push(m[1]);
        }
      };
      pc.createOffer().then((o) => pc.setLocalDescription(o)).catch(() => resolve(ips));
      setTimeout(() => { try { pc.close(); } catch {} resolve(ips); }, 2500);
    } catch { resolve([]); }
  });
  const publicLeaked = publicIp && leak.some((i) => i === publicIp);
  checks.push({
    id: 'webrtc',
    label: 'WebRTC leak',
    icon: Wifi,
    status: publicLeaked ? 'warn' : 'pass',
    detail: publicLeaked
      ? 'Your public IP is exposed via WebRTC. If you use a VPN, verify the leak protection is enabled.'
      : `No public IP leak detected via WebRTC${leak.length ? ` (local candidates: ${leak.length})` : ''}.`,
  });

  // Screen & device fingerprint (informational)
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  checks.push({
    id: 'timezone',
    label: 'Timezone / locale',
    icon: MapPin,
    status: 'pass',
    detail: `${tz} · ${nav.language} · screen ${window.screen.width}×${window.screen.height}`,
  });

  // Connection type
  const con = nav.connection || nav.mozConnection || nav.webkitConnection;
  if (con) {
    checks.push({
      id: 'connection',
      label: 'Network connection',
      icon: Wifi,
      status: 'pass',
      detail: `${con.effectiveType?.toUpperCase() || 'Unknown'} · downlink ${con.downlink ?? '?'} Mbps · saveData: ${con.saveData ? 'on' : 'off'}`,
    });
  }

  // Password manager presence (heuristic — can't detect, so prompt)
  checks.push({
    id: 'passwords',
    label: 'Password hygiene reminder',
    icon: Fingerprint,
    status: 'warn',
    detail: 'Use a password manager (1Password, Bitwarden) and unique passwords for every financial site. Never save financial passwords in your browser.',
  });

  return checks;
}

const statusStyles = {
  pass: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: CheckCircle2, dot: 'bg-emerald-500' },
  warn: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: AlertTriangle, dot: 'bg-amber-500' },
  fail: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', icon: XCircle, dot: 'bg-rose-500' },
};

const verdictStyles = {
  safe: { bg: 'from-emerald-500 to-emerald-600', icon: ShieldCheck, label: 'Safe to proceed', sub: 'Your browser and this URL look clean.' },
  caution: { bg: 'from-amber-500 to-orange-500', icon: ShieldAlert, label: 'Proceed with caution', sub: 'A few signals need your attention before entering credentials.' },
  danger: { bg: 'from-rose-600 to-red-700', icon: ShieldOff, label: 'Do not enter credentials', sub: 'We detected high-risk signals. Do not log in to any financial site from this URL.' },
};

export default function ScanPage({ embedded = false }) {
  const [phase, setPhase] = useState('idle'); // idle | running | done
  const [progress, setProgress] = useState(0);
  const [browserChecks, setBrowserChecks] = useState([]);
  const [publicIp, setPublicIp] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlScan, setUrlScan] = useState(null);
  const [scanningUrl, setScanningUrl] = useState(false);

  useEffect(() => {
    api.get('/scan/ip').then(r => setPublicIp(r.data.ip)).catch(() => {});
  }, []);

  const runScan = async () => {
    setPhase('running');
    setProgress(0);
    setBrowserChecks([]);
    const checks = await runBrowserChecks(publicIp);
    // animate progressive reveal
    for (let i = 0; i < checks.length; i++) {
      await new Promise(r => setTimeout(r, 280));
      setBrowserChecks(checks.slice(0, i + 1));
      setProgress(Math.round(((i + 1) / checks.length) * 100));
    }
    setPhase('done');
  };

  const scanUrl = async () => {
    if (!urlInput.trim()) { toast.error('Paste a URL to check'); return; }
    setScanningUrl(true); setUrlScan(null);
    try {
      const { data } = await api.post('/scan/url', { url: urlInput.trim() });
      setUrlScan(data);
      if (data.verdict === 'danger') toast.error('High-risk URL — do not enter credentials');
      else if (data.verdict === 'caution') toast.warning('URL has warnings — verify carefully');
      else toast.success('URL looks clean');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not scan URL');
    } finally { setScanningUrl(false); }
  };

  // Aggregate verdict from browser checks
  const browserFails = browserChecks.filter(c => c.status === 'fail').length;
  const browserWarns = browserChecks.filter(c => c.status === 'warn').length;
  const browserVerdict = browserFails >= 1 ? 'danger' : browserWarns >= 2 ? 'caution' : phase === 'done' ? 'safe' : null;

  const wrapperClass = embedded ? '' : 'min-h-screen bg-slate-50';

  return (
    <div className={wrapperClass} data-testid="scan-page">
      <div className={embedded ? 'space-y-6' : 'mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-6'}>
        {!embedded && (
          <div>
            <Badge variant="outline" className="border-blue-200 text-[#0B3B82] mb-3">Pre-Flight Security Scan</Badge>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-slate-900 max-w-3xl text-balance">
              Run a 30-second security check before your bank or crypto site.
            </h1>
            <p className="mt-3 text-slate-600 max-w-2xl">
              One-click browser-environment audit plus URL threat analysis. Catches phishing lookalikes, HTTPS issues, WebRTC leaks, and outdated browsers before you type your password.
            </p>
          </div>
        )}
        {embedded && (
          <div>
            <h2 className="font-display font-bold text-2xl text-slate-900">Pre-Flight Security Scan</h2>
            <p className="text-slate-600 text-sm mt-1">Run a security check before logging into banks, crypto exchanges, or brokerage accounts.</p>
          </div>
        )}

        {/* Browser scan */}
        <Card className="border-slate-200 overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-lg bg-blue-50 border border-blue-100 grid place-items-center">
                  <Monitor className="h-5 w-5 text-[#0B3B82]" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-slate-900">Browser & device scan</h3>
                  <p className="text-xs text-slate-500">Your IP: <span className="font-mono">{publicIp || '—'}</span></p>
                </div>
              </div>
              <Button
                onClick={runScan}
                disabled={phase === 'running'}
                size="lg"
                className="bg-[#0B3B82] hover:bg-[#0a3270]"
                data-testid="run-browser-scan"
              >
                {phase === 'running' ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Scanning…</> : phase === 'done' ? <><RefreshCw className="h-4 w-4 mr-2" /> Run again</> : <><Search className="h-4 w-4 mr-2" /> Run quick scan</>}
              </Button>
            </div>

            {/* Progress */}
            {phase === 'running' && (
              <div className="px-6 pt-4">
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#1E6FD9] to-[#0B3B82] transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-2 text-xs text-slate-500">Running check {browserChecks.length} / 10 — {progress}%</div>
              </div>
            )}

            {/* Verdict */}
            {phase === 'done' && browserVerdict && (
              <div className="p-6">
                <div className={`rounded-xl bg-gradient-to-br ${verdictStyles[browserVerdict].bg} text-white p-5 flex items-center gap-4`} data-testid="scan-verdict">
                  {React.createElement(verdictStyles[browserVerdict].icon, { className: 'h-10 w-10' })}
                  <div>
                    <div className="font-display font-bold text-xl">{verdictStyles[browserVerdict].label}</div>
                    <div className="text-sm opacity-90">{verdictStyles[browserVerdict].sub}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Checks */}
            {browserChecks.length > 0 && (
              <div className="p-6 pt-0 grid gap-2.5 md:grid-cols-2">
                {browserChecks.map(c => {
                  const s = statusStyles[c.status];
                  return (
                    <div key={c.id} className={`rounded-lg border ${s.border} ${s.bg} p-3.5 flex items-start gap-3 gts-fade-up`} data-testid={`check-${c.id}`}>
                      <div className={`h-8 w-8 rounded-md bg-white border ${s.border} grid place-items-center flex-shrink-0`}>
                        {React.createElement(c.icon || Info, { className: `h-4 w-4 ${s.text}` })}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`font-semibold text-sm ${s.text}`}>{c.label}</div>
                          <div className={`text-[10px] uppercase tracking-wider font-bold ${s.text}`}>{c.status}</div>
                        </div>
                        <div className="text-xs text-slate-700 mt-0.5 leading-relaxed">{c.detail}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {phase === 'idle' && (
              <div className="p-10 text-center">
                <Shield className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="mt-3 text-sm text-slate-500">Click <strong>Run quick scan</strong> to check your browser environment.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* URL scan */}
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-11 w-11 rounded-lg bg-amber-50 border border-amber-200 grid place-items-center flex-shrink-0">
                <LinkIcon className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-slate-900">Scan a URL before you visit</h3>
                <p className="text-xs text-slate-500 mt-0.5">Paste the bank, crypto, or brokerage URL you're about to log into. We'll check for typosquatting, fake TLS, phishing patterns, and more.</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="e.g. https://www.chase.com/login"
                className="flex-1 min-w-[260px]"
                onKeyDown={e => e.key === 'Enter' && scanUrl()}
                data-testid="url-scan-input"
              />
              <Button onClick={scanUrl} disabled={scanningUrl} className="bg-[#0B3B82] hover:bg-[#0a3270]" data-testid="url-scan-btn">
                {scanningUrl ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Analyzing…</> : <><Search className="h-4 w-4 mr-2" /> Scan URL</>}
              </Button>
            </div>

            {urlScan && (
              <div className="mt-6 space-y-4">
                <div className={`rounded-xl bg-gradient-to-br ${verdictStyles[urlScan.verdict].bg} text-white p-4 flex items-center gap-3`} data-testid="url-verdict">
                  {React.createElement(verdictStyles[urlScan.verdict].icon, { className: 'h-8 w-8' })}
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold">{verdictStyles[urlScan.verdict].label}</div>
                    <div className="text-xs opacity-90 truncate">{urlScan.host} — {urlScan.summary.pass} passed, {urlScan.summary.warn} warnings, {urlScan.summary.fail} failures</div>
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {urlScan.checks.map(c => {
                    const s = statusStyles[c.status];
                    return (
                      <div key={c.id} className={`rounded-lg border ${s.border} ${s.bg} p-3 flex items-start gap-2`} data-testid={`url-check-${c.id}`}>
                        {React.createElement(s.icon, { className: `h-4 w-4 ${s.text} mt-0.5 flex-shrink-0` })}
                        <div className="text-xs flex-1">
                          <div className={`font-semibold ${s.text}`}>{c.label}</div>
                          <div className="text-slate-700 mt-0.5 leading-relaxed">{c.detail}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="p-6">
            <h3 className="font-display font-semibold text-slate-900 flex items-center gap-2"><Clock className="h-4 w-4 text-[#0B3B82]" /> Quick safety tips for financial sites</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-sm text-slate-700">
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" /> Type the URL yourself or use a saved bookmark — never click email links.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" /> Check the padlock icon and verify the domain before typing a password.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" /> Enable two-factor authentication (TOTP app, not SMS).</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" /> Use a password manager — never reuse passwords across sites.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" /> Log out when finished and close the browser window.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" /> If anything looks off, call your bank from the number on your card.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
