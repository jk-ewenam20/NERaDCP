import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { RiAlertLine, RiMailLine, RiLockPasswordLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error?.message ?? 'Invalid credentials';
      toast.error(msg);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header strip */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-red-500 rounded-2xl mb-4 shadow-lg">
              <RiAlertLine className="text-white text-3xl" />
            </div>
            <h1 className="text-xl font-bold text-white">Emergency Command Centre</h1>
            <p className="text-slate-400 text-sm mt-1">Ghana Emergency Response System</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Signing in…' : 'Sign in to Command Centre'}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-slate-400">
              Restricted access — authorised personnel only
            </p>
          </div>
        </div>

        {/* Role hint */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-center">
          {[
            { label: 'Medical', color: 'bg-emerald-500' },
            { label: 'Police', color: 'bg-blue-500' },
            { label: 'Fire', color: 'bg-orange-500' },
            { label: 'System Admin', color: 'bg-slate-500' },
          ].map(({ label, color }) => (
            <div key={label} className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-slate-300">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
