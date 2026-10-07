import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, Sparkles, Lock, Mail, ArrowRight, ShieldCheck, 
  CheckCircle2, AlertCircle, Eye, EyeOff, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  
  const [email, setEmail] = useState('client@saffronbistro.com');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      setLoading(true);
      setError(null);
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail, userPassword = 'Password123!') => {
    try {
      setLoading(true);
      setError(null);
      setEmail(userEmail);
      setPassword(userPassword);
      await login(userEmail.trim(), userPassword);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 text-slate-800">
      <div className="max-w-md w-full">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center p-2 rounded-2xl hover:opacity-90 transition-opacity">
            <img src="/redes-logo.png" alt="Redes Creation" className="h-12 w-auto object-contain" />
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-3">
            Sign In to Workspace
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Google Reviews & Local SEO Intelligence Platform
          </p>
        </div>

        {/* Clean Login Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 transition"
                  placeholder="name@company.com"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-xs text-[#034bc0] font-medium hover:underline cursor-pointer"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#034bc0] focus:ring-2 focus:ring-[#034bc0]/20 transition"
                  placeholder="••••••••••••"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#034bc0] hover:bg-[#023aa0] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Sign In to Workspace <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="pt-5 mt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleQuickLogin('client@saffronbistro.com')}
              className="w-full py-2.5 px-3 text-xs font-bold rounded-xl bg-blue-50 hover:bg-blue-100 text-[#034bc0] border border-blue-200 transition text-center cursor-pointer flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-[#034bc0]" />
              <span>1-Click Instant Client Demo Sign In</span>
            </button>
          </div>

          <div className="text-center pt-4">
            <p className="text-xs text-slate-500">
              Don't have a workspace yet?{' '}
              <Link to="/register" className="text-[#034bc0] font-bold hover:underline cursor-pointer">
                Create Free Workspace
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Footnote */}
        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Multi-Tenant Isolated</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#034bc0]" /> Google Verified Partner</span>
        </div>
      </div>
    </div>
  );
}
