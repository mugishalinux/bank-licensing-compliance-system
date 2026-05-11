import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../utils/formatters';

export default function LoginPage() {
  const { requestLoginOtp, confirmLoginOtp } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);

  const doRequest = async () => {
    setBusy(true);
    try {
      await requestLoginOtp(email.trim().toLowerCase(), password);
      toast.success('A 6-digit code has been sent to your email');
      setStep('otp');
    } catch (e) {
      toast.error(errorMessage(e, 'Invalid email or password'));
    } finally {
      setBusy(false);
    }
  };

  const doVerify = async () => {
    setBusy(true);
    try {
      await confirmLoginOtp(email.trim().toLowerCase(), otp.trim());
      nav('/');
    } catch (e) {
      toast.error(errorMessage(e, 'Invalid or expired code'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Sign in" subtitle="Welcome back to BNR Licensing Portal">
      {step === 'credentials' ? (
        <form onSubmit={(e) => { e.preventDefault(); void doRequest(); }} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@bnr.rw"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            {busy ? 'Sending code…' : 'Continue'}
          </button>
          <div className="flex items-center justify-between text-[12px] pt-1">
            <Link to="/forgot-password" className="text-bnr hover:underline">Forgot password?</Link>
            <Link to="/register" className="text-bnr hover:underline">Create an account</Link>
          </div>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); void doVerify(); }} className="space-y-4">
          <div>
            <button
              type="button"
              onClick={() => { setStep('credentials'); setOtp(''); }}
              className="text-[12px] text-[color:var(--color-ink-soft)] inline-flex items-center gap-1 hover:text-bnr"
            >
              <ArrowLeft size={13} /> Change email
            </button>
          </div>
          <div>
            <label className="label">Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="input text-center text-lg tracking-[0.4em]"
              placeholder="••••••"
            />
            <p className="text-[11px] text-[color:var(--color-ink-soft)] mt-1.5">
              Sent to <span className="font-medium">{email}</span>. Expires in 5 minutes.
            </p>
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={busy || otp.length !== 6}>
            {busy ? 'Verifying…' : 'Sign in'}
          </button>
          <button
            type="button"
            onClick={() => { void doRequest(); }}
            className="btn btn-ghost w-full"
            disabled={busy}
          >
            Resend code
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex bg-bnr text-white flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded bg-white text-bnr flex items-center justify-center font-bold">BNR</div>
          <div>
            <div className="font-semibold">Licensing Portal</div>
            <div className="text-white/70 text-[12px]">National Bank of Rwanda</div>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-semibold leading-tight max-w-md">
            Licensing & compliance for Rwanda's financial sector.
          </h2>
          <p className="mt-3 text-white/80 text-sm max-w-md">
            Submit and track license applications, respond to reviewer requests, and stay compliant — all in one place.
          </p>
        </div>
        <div className="text-[12px] text-white/60">© {new Date().getFullYear()} National Bank of Rwanda</div>
      </div>

      <div className="flex items-center justify-center px-6 py-12 bg-[color:var(--color-surface)]">
        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h1 className="text-xl font-semibold">{title}</h1>
            {subtitle && <p className="text-[13px] text-[color:var(--color-ink-soft)] mt-1">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
