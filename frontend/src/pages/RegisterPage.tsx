import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ApplicantType } from '../types';
import { authApi } from '../api/auth';
import { errorMessage } from '../utils/formatters';
import { AuthShell } from './LoginPage';

export default function RegisterPage() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    applicant_type: ApplicantType.INDIVIDUAL as ApplicantType,
    institution_name: '',
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setBusy(true);
    try {
      await authApi.register({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || undefined,
        applicant_type: form.applicant_type,
        institution_name:
          form.applicant_type === ApplicantType.ORGANIZATION
            ? form.institution_name.trim()
            : undefined,
      });
      toast.success('Account created — sign in to continue');
      nav('/login');
    } catch (e) {
      toast.error(errorMessage(e, 'Could not create account'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Apply for a license with the National Bank of Rwanda">
      <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
        <div>
          <label className="label">I am applying as</label>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { v: ApplicantType.INDIVIDUAL, l: 'An individual' },
                { v: ApplicantType.ORGANIZATION, l: 'An organization' },
              ] as const
            ).map((o) => (
              <button
                type="button"
                key={o.v}
                onClick={() => set('applicant_type', o.v)}
                className={`px-3 py-2.5 text-[13px] rounded border ${
                  form.applicant_type === o.v
                    ? 'border-bnr bg-bnr-soft text-bnr font-medium'
                    : 'border-[color:var(--color-bnr-line)] hover:bg-bnr-soft/50'
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Full name</label>
          <input className="input" required value={form.full_name} onChange={(e) => set('full_name', e.target.value)} />
        </div>

        {form.applicant_type === ApplicantType.ORGANIZATION && (
          <div>
            <label className="label">Institution name</label>
            <input
              className="input"
              required
              value={form.institution_name}
              onChange={(e) => set('institution_name', e.target.value)}
              placeholder="Bank of Rwanda Plc"
            />
          </div>
        )}

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="label">Phone <span className="text-[color:var(--color-ink-soft)] font-normal">(optional)</span></label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            className="input"
            placeholder="+250 …"
          />
        </div>

        <div>
          <label className="label">Password</label>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            className="input"
          />
          <p className="text-[11px] text-[color:var(--color-ink-soft)] mt-1">At least 8 characters.</p>
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-[12px] text-center text-[color:var(--color-ink-soft)] pt-1">
          Already have an account?{' '}
          <Link to="/login" className="text-bnr hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
