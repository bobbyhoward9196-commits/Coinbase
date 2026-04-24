import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '../../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import { Monitor, Laptop, Smartphone, Tablet, Server, Router, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const typeIcons = {
  'Desktop PC': Monitor, 'Laptop': Laptop, 'Phone': Smartphone, 'Tablet': Tablet,
  'Server': Server, 'Router': Router, 'Other': Monitor,
};
const deviceTypes = ['Desktop PC','Laptop','Phone','Tablet','Server','Router','Other'];
const blank = { name: '', type: 'Desktop PC', os: '', manufacturer: '', model: '', serial: '', processor: '', ram: '', storage: '', notes: '' };

export default function CustomerDevices() {
  const [devices, setDevices] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);

  const load = () => api.get('/devices').then(r => setDevices(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(blank); setEditing(null); setOpen(true); };
  const openEdit = (d) => { setForm({ ...blank, ...d }); setEditing(d.id); setOpen(true); };

  const save = async () => {
    if (!form.name || !form.type) { toast.error('Name and type required'); return; }
    try {
      const payload = { ...form };
      if (editing) {
        await api.patch(`/devices/${editing}`, payload);
        toast.success('Device updated');
      } else {
        await api.post('/devices', payload);
        toast.success('Device added');
      }
      setOpen(false); load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save');
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this device?')) return;
    await api.delete(`/devices/${id}`); toast.success('Deleted'); load();
  };

  return (
    <div className="space-y-6" data-testid="customer-devices">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-900">My PC & device info</h2>
          <p className="text-slate-600 text-sm mt-1">
            Keep your devices on file so technicians can diagnose faster. All information is private to you and your assigned advisor.
          </p>
        </div>
        <Button onClick={openNew} className="bg-[#0B3B82] hover:bg-[#0a3270]" data-testid="add-device-btn">
          <Plus className="h-4 w-4 mr-1" /> Add device
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {devices.map(d => {
          const Icon = typeIcons[d.type] || Monitor;
          return (
            <Card key={d.id} className="border-slate-200" data-testid={`device-${d.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="h-11 w-11 rounded-lg bg-blue-50 border border-blue-100 grid place-items-center">
                    <Icon className="h-5 w-5 text-[#0B3B82]" />
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(d)} data-testid={`edit-device-${d.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => del(d.id)} data-testid={`del-device-${d.id}`}><Trash2 className="h-3.5 w-3.5 text-rose-600" /></Button>
                  </div>
                </div>
                <h3 className="mt-3 font-display font-semibold text-slate-900">{d.name}</h3>
                <Badge variant="outline" className="mt-1 text-[10px]">{d.type}</Badge>
                <dl className="mt-4 text-xs space-y-1.5">
                  {d.manufacturer && <div className="flex justify-between"><dt className="text-slate-500">Maker</dt><dd className="font-medium text-slate-900">{d.manufacturer}</dd></div>}
                  {d.model && <div className="flex justify-between"><dt className="text-slate-500">Model</dt><dd className="font-medium text-slate-900">{d.model}</dd></div>}
                  {d.os && <div className="flex justify-between"><dt className="text-slate-500">OS</dt><dd className="font-medium text-slate-900">{d.os}</dd></div>}
                  {d.processor && <div className="flex justify-between"><dt className="text-slate-500">CPU</dt><dd className="font-medium text-slate-900 truncate max-w-[60%]">{d.processor}</dd></div>}
                  {d.ram && <div className="flex justify-between"><dt className="text-slate-500">RAM</dt><dd className="font-medium text-slate-900">{d.ram}</dd></div>}
                  {d.storage && <div className="flex justify-between"><dt className="text-slate-500">Storage</dt><dd className="font-medium text-slate-900 truncate max-w-[60%]">{d.storage}</dd></div>}
                  {d.serial && <div className="flex justify-between"><dt className="text-slate-500">Serial</dt><dd className="font-mono text-[10px] text-slate-900 truncate max-w-[60%]">{d.serial}</dd></div>}
                </dl>
                {d.notes && <p className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 italic">{d.notes}</p>}
              </CardContent>
            </Card>
          );
        })}
        {devices.length === 0 && (
          <div className="col-span-full">
            <Card className="border-dashed border-slate-300">
              <CardContent className="p-10 text-center">
                <Monitor className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="mt-3 text-sm text-slate-500">No devices yet. Add your first PC, laptop, or phone.</p>
                <Button onClick={openNew} className="mt-4 bg-[#0B3B82] hover:bg-[#0a3270]"><Plus className="h-4 w-4 mr-1" />Add device</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Edit device' : 'Add a device'}</DialogTitle></DialogHeader>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Device name *</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1.5" placeholder="e.g., Main Desktop" data-testid="device-name" /></div>
            <div>
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="mt-1.5" data-testid="device-type"><SelectValue /></SelectTrigger>
                <SelectContent>{deviceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Operating system</Label><Input value={form.os || ''} onChange={e => setForm({ ...form, os: e.target.value })} className="mt-1.5" placeholder="Windows 11 Pro" data-testid="device-os" /></div>
            <div><Label>Manufacturer</Label><Input value={form.manufacturer || ''} onChange={e => setForm({ ...form, manufacturer: e.target.value })} className="mt-1.5" placeholder="Dell, Apple, Lenovo…" data-testid="device-mfr" /></div>
            <div><Label>Model</Label><Input value={form.model || ''} onChange={e => setForm({ ...form, model: e.target.value })} className="mt-1.5" placeholder="OptiPlex 7090" data-testid="device-model" /></div>
            <div><Label>Serial number</Label><Input value={form.serial || ''} onChange={e => setForm({ ...form, serial: e.target.value })} className="mt-1.5" data-testid="device-serial" /></div>
            <div><Label>Processor</Label><Input value={form.processor || ''} onChange={e => setForm({ ...form, processor: e.target.value })} className="mt-1.5" placeholder="Intel Core i7-11700" data-testid="device-cpu" /></div>
            <div><Label>RAM</Label><Input value={form.ram || ''} onChange={e => setForm({ ...form, ram: e.target.value })} className="mt-1.5" placeholder="16 GB" data-testid="device-ram" /></div>
            <div className="sm:col-span-2"><Label>Storage</Label><Input value={form.storage || ''} onChange={e => setForm({ ...form, storage: e.target.value })} className="mt-1.5" placeholder="1 TB NVMe SSD" data-testid="device-storage" /></div>
            <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={3} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1.5" placeholder="Purpose, warranty, known issues…" data-testid="device-notes" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-[#0B3B82] hover:bg-[#0a3270]" data-testid="device-save">{editing ? 'Save' : 'Add device'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
