import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed. Please check your credentials.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Building2 className="text-blue-600" size={32} />
            <div>
              <h1 className="text-xl font-bold text-gray-900">BNR Licensing Portal</h1>
              <p className="text-sm text-gray-500">National Bank of Rwanda</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.rw"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Test accounts by role</p>
            <div className="space-y-2 text-xs text-gray-700">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 w-20 justify-center shrink-0">Admin</span>
                <button
                  type="button"
                  onClick={() => { setEmail('admin@bnr.rw'); setPassword('Admin@1234'); }}
                  className="font-mono text-left hover:text-blue-600 transition-colors"
                >admin@bnr.rw / Admin@1234</button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 w-20 justify-center shrink-0">Reviewer</span>
                <button
                  type="button"
                  onClick={() => { setEmail('reviewer@bnr.rw'); setPassword('Reviewer@1234'); }}
                  className="font-mono text-left hover:text-blue-600 transition-colors"
                >reviewer@bnr.rw / Reviewer@1234</button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 w-20 justify-center shrink-0">Approver</span>
                <button
                  type="button"
                  onClick={() => { setEmail('approver@bnr.rw'); setPassword('Approver@1234'); }}
                  className="font-mono text-left hover:text-blue-600 transition-colors"
                >approver@bnr.rw / Approver@1234</button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 w-20 justify-center shrink-0">Applicant 1</span>
                <button
                  type="button"
                  onClick={() => { setEmail('bank1@example.rw'); setPassword('Bank1@1234'); }}
                  className="font-mono text-left hover:text-blue-600 transition-colors"
                >bank1@example.rw / Bank1@1234</button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 w-20 justify-center shrink-0">Applicant 2</span>
                <button
                  type="button"
                  onClick={() => { setEmail('bank2@example.rw'); setPassword('Bank2@1234'); }}
                  className="font-mono text-left hover:text-blue-600 transition-colors"
                >bank2@example.rw / Bank2@1234</button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Click any row to fill the form</p>
          </div>
        </div>
      </div>
    </div>
  );
}
