import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { authApi } from '../api/auth';
import { errorMessage } from '../utils/formatters';
import { AuthShell } from './LoginPage';

export default function ForgotPasswordPage() {
  const nav = useNavigate();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);

  const sendCode = async () => {
    setBusy(true);
    try {
      await authApi.requestPasswordReset(email.trim().toLowerCase());
      toast.success('If an account exists, a code has been sent');
      setStep('reset');
    } catch (e) {
      toast.error(errorMessage(e, 'Could not send reset code'));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      await authApi.confirmPasswordReset(email.trim().toLowerCase(), otp.trim(), pw);
      toast.success('Password updated — sign in with your new password');
      nav('/login');
    } catch (e) {
      toast.error(errorMessage(e, 'Invalid or expired code'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={step === 'email' ? 'Reset password' : 'Set a new password'}
      subtitle={
        step === 'email'
          ? "We'll email you a 6-digit code"
          : `Enter the code we sent to ${email}`
      }
    >
      {step === 'email' ? (
        <form onSubmit={(e) => { e.preventDefault(); void sendCode(); }} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            {busy ? 'Sending…' : 'Send code'}
          </button>
          <p className="text-[12px] text-center pt-1">
            <Link to="/login" className="text-bnr hover:underline">Back to sign in</Link>
          </p>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); void reset(); }} className="space-y-4">
          <button
            type="button"
            onClick={() => setStep('email')}
            className="text-[12px] text-[color:var(--color-ink-soft)] inline-flex items-center gap-1 hover:text-bnr"
          >
            <ArrowLeft size={13} /> Change email
          </button>
          <div>
            <label className="label">Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="input text-center text-lg tracking-[0.4em]"
              placeholder="••••••"
            />
          </div>
          <div>
            <label className="label">New password</label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="input"
            />
            <p className="text-[11px] text-[color:var(--color-ink-soft)] mt-1">At least 8 characters.</p>
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={busy || otp.length !== 6}>
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
