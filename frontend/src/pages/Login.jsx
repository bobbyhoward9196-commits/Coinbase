import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Shield, Wrench, UserCog, Lock, MailCheck, ArrowLeft, RefreshCw } from 'lucide-react';

const OTP_LENGTH = 6;

export default function Login() {
  const navigate = useNavigate();
  const { login, verifyOtp, resendOtp } = useAuth();
  const [role, setRole] = useState('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP step state
  const [otpStep, setOtpStep] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (otpStep && inputsRef.current[0]) inputsRef.current[0].focus();
  }, [otpStep]);

  const routeByRole = (u) => {
    if (u.role === 'admin') navigate('/admin');
    else if (u.role === 'technician') navigate('/technician');
    else navigate('/dashboard');
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password, role);
      if (result?.otp_required) {
        setOtpEmail(result.email);
        setMaskedEmail(result.masked_email || result.email);
        setOtpStep(true);
        setResendCooldown(30);
        toast.success('Verification code sent to your email');
      } else {
        toast.success(`Welcome back, ${result.name}`);
        routeByRole(result);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (idx, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[idx] = digit;
    setOtpDigits(next);
    if (digit && idx < OTP_LENGTH - 1) inputsRef.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === 'ArrowLeft' && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) inputsRef.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtpDigits(next);
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const verify = async (e) => {
    e?.preventDefault?.();
    const code = otpDigits.join('');
    if (code.length !== OTP_LENGTH) return toast.error('Enter the complete 6-digit code');
    setOtpLoading(true);
    try {
      const u = await verifyOtp(otpEmail, code);
      toast.success(`Welcome back, ${u.name}`);
      routeByRole(u);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Verification failed');
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  const onResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await resendOtp(otpEmail);
      toast.success('A new code has been sent');
      setResendCooldown(30);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to resend code');
    }
  };

  const backToLogin = () => {
    setOtpStep(false);
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    setPassword('');
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
            <h2 className="font-display font-bold text-3xl lg:text-4xl leading-tight">
              {otpStep ? 'One more step.' : 'Welcome back.'}
            </h2>
            <p className="mt-3 text-slate-300 max-w-sm">
              {otpStep
                ? 'For your protection, we send a one-time code to your email every time you sign in as a customer.'
                : 'Sign in to manage your plan, view invoices, track appointments, and chat with your dedicated technician.'}
            </p>
            <div className="mt-8 flex items-center gap-2 text-sm text-slate-400">
              <Lock className="h-4 w-4" /> Encrypted connection · two-factor verification
            </div>
          </div>
          <div className="text-xs text-slate-400">© {new Date().getFullYear()} Global Tech Solutions</div>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <Card className="w-full max-w-md border-slate-200 shadow-sm">
          <CardContent className="p-7">
            {!otpStep ? (
              <>
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
                        {r === 'customer' && (
                          <div className="flex items-start gap-2 rounded-md bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800">
                            <MailCheck className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>Protected by email verification — we'll send a 6-digit code after you enter your password.</span>
                          </div>
                        )}
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
              </>
            ) : (
              <div data-testid="otp-step">
                <button onClick={backToLogin} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4" data-testid="otp-back-btn">
                  <ArrowLeft className="h-4 w-4" /> Back to sign in
                </button>
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-50 mb-4">
                  <MailCheck className="h-6 w-6 text-[#0B3B82]" />
                </div>
                <h1 className="font-display font-bold text-2xl text-slate-900">Check your email</h1>
                <p className="mt-2 text-sm text-slate-600">
                  We sent a 6-digit verification code to <span className="font-semibold text-slate-900" data-testid="otp-masked-email">{maskedEmail}</span>. It expires in 5 minutes.
                </p>

                <form onSubmit={verify} className="mt-6 space-y-5" data-testid="otp-form">
                  <div className="flex items-center justify-between gap-2" onPaste={handlePaste}>
                    {otpDigits.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => (inputsRef.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        className="h-14 w-11 sm:w-12 text-center text-2xl font-bold font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B3B82] focus:border-[#0B3B82] tracking-widest"
                        data-testid={`otp-digit-${i}`}
                      />
                    ))}
                  </div>
                  <Button type="submit" disabled={otpLoading} className="w-full bg-[#0B3B82] hover:bg-[#0a3270]" data-testid="otp-submit-btn">
                    {otpLoading ? 'Verifying…' : 'Verify & sign in'}
                  </Button>
                </form>

                <div className="mt-5 flex items-center justify-center text-sm text-slate-500">
                  <span>Didn't get the code?</span>
                  <button
                    type="button"
                    onClick={onResend}
                    disabled={resendCooldown > 0}
                    className="ml-1.5 font-semibold text-[#0B3B82] hover:underline disabled:text-slate-400 disabled:no-underline inline-flex items-center gap-1"
                    data-testid="otp-resend-btn"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
