import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created. Welcome aboard!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <section className="mx-auto max-w-md px-4 py-14" data-testid="register-page">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-7">
          <h1 className="font-display font-bold text-2xl text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Join Global Tech Solutions to book support, track tickets, and chat with your technician.</p>
          <form onSubmit={submit} className="mt-6 space-y-4" data-testid="register-form">
            <div><Label>Full name</Label><Input required className="mt-1.5" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} data-testid="reg-name" /></div>
            <div><Label>Email</Label><Input required type="email" className="mt-1.5" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} data-testid="reg-email" /></div>
            <div><Label>Password</Label><Input required type="password" className="mt-1.5" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} data-testid="reg-password" /></div>
            <div><Label>Phone (optional)</Label><Input className="mt-1.5" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} data-testid="reg-phone" /></div>
            <div><Label>Address (optional)</Label><Input className="mt-1.5" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} data-testid="reg-address" /></div>
            <Button type="submit" disabled={loading} className="w-full bg-[#0B3B82] hover:bg-[#0a3270]" data-testid="reg-submit">
              {loading ? 'Creating…' : 'Create account'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-[#0B3B82] hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
