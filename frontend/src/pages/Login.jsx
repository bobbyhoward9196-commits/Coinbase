import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Shield, Wrench, UserCog, Lock } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password, role);
      toast.success(`Welcome back, ${user.name}`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'technician') navigate('/technician');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <section className="min-h-[calc(100vh-64px)] grid md:grid-cols-2" data-testid="login-page">
      <div className="relative hidden md:block gts-gradient-hero">
        <div className="absolute inset-0 gts-grid-pattern opacity-40" />
        <div className="relative h-full flex flex-col justify-between p-10 text-white">
          <div className="flex items-center gap-2.5">
            <img src="/images/logo.jpeg" alt="" className="h-10 w-10 rounded" />
            <div>
              <div className="font-display font-bold">GLOBAL TECH</div>
              <div className="text-xs tracking-[0.25em] text-slate-300">S O L U T I O N S</div>
            </div>
          </div>
          <div>
            <h2 className="font-display font-bold text-3xl lg:text-4xl leading-tight">Welcome back.</h2>
            <p className="mt-3 text-slate-300 max-w-sm">Sign in to manage your plan, view invoices, track appointments, and chat with your dedicated technician.</p>
            <div className="mt-8 flex items-center gap-2 text-sm text-slate-400"><Lock className="h-4 w-4" /> Encrypted connection · your data is safe</div>
          </div>
          <div className="text-xs text-slate-400">© {new Date().getFullYear()} Global Tech Solutions</div>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <Card className="w-full max-w-md border-slate-200 shadow-sm">
          <CardContent className="p-7">
            <h1 className="font-display font-bold text-2xl text-slate-900">Sign in</h1>
            <p className="mt-1 text-sm text-slate-500">Access your customer, technician, or admin portal.</p>

            <Tabs value={role} onValueChange={setRole} className="mt-5">
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="customer" className="py-2" data-testid="tab-customer"><Shield className="mr-1.5 h-4 w-4" />Customer</TabsTrigger>
                <TabsTrigger value="technician" className="py-2" data-testid="tab-technician"><Wrench className="mr-1.5 h-4 w-4" />Technician</TabsTrigger>
                <TabsTrigger value="admin" className="py-2" data-testid="tab-admin"><UserCog className="mr-1.5 h-4 w-4" />Admin</TabsTrigger>
              </TabsList>
              {['customer','technician','admin'].map(r => (
                <TabsContent key={r} value={r}>
                  <form onSubmit={submit} className="mt-5 space-y-4" data-testid={`login-form-${r}`}>
                    <div>
                      <Label>Email</Label>
                      <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5" data-testid={`login-email-${r}`} />
                    </div>
                    <div>
                      <Label>Password</Label>
                      <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1.5" data-testid={`login-password-${r}`} />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-[#0B3B82] hover:bg-[#0a3270]" data-testid={`login-submit-${r}`}>
                      {loading ? 'Signing in…' : `Sign in as ${r}`}
                    </Button>
                  </form>
                </TabsContent>
              ))}
            </Tabs>

            {role === 'customer' && (
              <p className="mt-5 text-center text-sm text-slate-500">
                New here?{' '}
                <Link to="/register" className="font-semibold text-[#0B3B82] hover:underline" data-testid="register-link">Create an account</Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
