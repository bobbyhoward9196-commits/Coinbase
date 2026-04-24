import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import { toast } from 'sonner';

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  denied: 'bg-rose-100 text-rose-800',
};

export default function AdminSoftwareRequests() {
  const [rows, setRows] = useState([]);
  const [techs, setTechs] = useState([]);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ status: '', advisor_notes: '', assigned_advisor_id: '' });
  const load = () => api.get('/software-requests').then(r => setRows(r.data));
  useEffect(() => { load(); api.get('/technicians').then(r => setTechs(r.data)); }, []);

  const openEdit = (r) => { setEdit(r); setForm({ status: r.status, advisor_notes: r.advisor_notes || '', assigned_advisor_id: r.assigned_advisor_id || '' }); };
  const save = async () => {
    await api.patch(`/software-requests/${edit.id}`, form);
    toast.success('Request updated'); setEdit(null); load();
  };

  return (
    <Card className="border-slate-200" data-testid="admin-software-requests">
      <CardContent className="p-6">
        <h2 className="font-display font-bold text-xl">Software requests</h2>
        <p className="text-slate-600 text-sm mt-1">Customer requests for included premium subscriptions and software.</p>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Request #</TableHead><TableHead>Customer</TableHead><TableHead>Software</TableHead>
              <TableHead>Qty</TableHead><TableHead>Advisor</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => {
              const t = techs.find(t => t.id === r.assigned_advisor_id);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.request_number}</TableCell>
                  <TableCell>
                    <div className="font-medium">{r.customer_name}</div>
                    <div className="text-xs text-slate-500">{r.customer_email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {r.is_gift && <span title="Loyalty gift" className="text-emerald-600">🎁</span>}
                      <div>
                        <div className="font-medium">{r.software_name}</div>
                        <div className="text-xs text-slate-500">{r.software_category}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{r.quantity}</TableCell>
                  <TableCell>{t?.name || '—'}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[r.status] || ''}>{r.status.replace('_',' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => openEdit(r)} data-testid={`review-${r.id}`}>Review</Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-slate-500 py-6">No software requests yet.</TableCell></TableRow>}
          </TableBody>
        </Table>

        <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
          <DialogContent>
            {edit && (
              <>
                <DialogHeader><DialogTitle>Review: {edit.software_name}</DialogTitle></DialogHeader>
                <div className="space-y-3 text-sm">
                  <div><span className="text-slate-500">Customer:</span> <span className="font-medium">{edit.customer_name}</span> ({edit.customer_email})</div>
                  <div><span className="text-slate-500">Quantity:</span> {edit.quantity}</div>
                  {edit.reason && <div><span className="text-slate-500">Reason:</span> <span className="italic">"{edit.reason}"</span></div>}
                </div>
                <div className="space-y-3 pt-3 border-t">
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger className="mt-1.5" data-testid="request-status-select"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['pending','under_review','approved','delivered','denied'].map(s => (
                          <SelectItem key={s} value={s}>{s.replace('_',' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Assign advisor</Label>
                    <Select value={form.assigned_advisor_id} onValueChange={(v) => setForm({ ...form, assigned_advisor_id: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Choose advisor" /></SelectTrigger>
                      <SelectContent>
                        {techs.map(t => <SelectItem key={t.id} value={t.id}>{t.name} — {t.specialization}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Advisor notes (visible to customer)</Label>
                    <Textarea rows={4} value={form.advisor_notes} onChange={e => setForm({ ...form, advisor_notes: e.target.value })} className="mt-1.5" data-testid="advisor-notes" placeholder="e.g., Approved. License key sent via encrypted email." />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button>
                  <Button onClick={save} className="bg-[#0B3B82] hover:bg-[#0a3270]" data-testid="request-save">Save</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
