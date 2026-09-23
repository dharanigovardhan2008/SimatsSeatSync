// Login Page Component - Premium Redesign
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { loginWithEmail, loginWithGoogle, getUserDocument, logout as firebaseLogout, createOrUpdateUserDocument } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, userData, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '';

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && userData) {
      if (redirectTo) navigate(redirectTo);
      else if (userData.role === 'admin') navigate('/admin');
      else if (userData.role === 'coordinator') navigate('/coordinator');
      else navigate('/student');
    }
  }, [user, userData, authLoading, navigate, redirectTo]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginWithEmail(email, password);
      const userEmail = result.user.email || '';

      const userDoc = await createOrUpdateUserDocument(
        result.user.uid,
        userEmail,
        { name: result.user.displayName || 'User' }
      );

      if (redirectTo) navigate(redirectTo);
      else if (userDoc.role === 'admin') navigate('/admin');
      else if (userDoc.role === 'coordinator') navigate('/coordinator');
      else navigate('/student');
    } catch (err: unknown) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      if (errorMessage.includes('invalid-credential') || errorMessage.includes('wrong-password')) {
        setError('Invalid email or password');
      } else if (errorMessage.includes('user-not-found')) {
        setError('No account found with this email');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await loginWithGoogle();
      const userEmail = result.user.email || '';
      const userDoc = await getUserDocument(result.user.uid);

      if (userDoc) {
        const updatedDoc = await createOrUpdateUserDocument(
          result.user.uid,
          userEmail,
          { name: result.user.displayName || 'User' }
        );

        if (redirectTo) navigate(redirectTo);
        else if (updatedDoc.role === 'admin') navigate('/admin');
        else if (updatedDoc.role === 'coordinator') navigate('/coordinator');
        else navigate('/student');
      } else {
        const googleName = result.user.displayName || '';
        await firebaseLogout();
        navigate(`/register?email=${encodeURIComponent(userEmail)}&name=${encodeURIComponent(googleName)}&google=true${redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : ''}`);
      }
    } catch (err: unknown) {
      console.error('Google login error:', err);
      setError('Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-transparent py-8 sm:py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Premium Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-2.5 mb-6 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3B9EFF] to-[#007AFF] flex items-center justify-center shadow-[0_8px_24px_rgba(59,158,255,0.25)] group-hover:shadow-[0_12px_32px_rgba(59,158,255,0.35)] transition-all group-hover:scale-105 group-active:scale-95">
              <Sparkles className="w-7 h-7 text-white" strokeWidth={2} />
            </div>
          </Link>
          <h1 className="font-extrabold text-[32px] sm:text-[40px] text-[#1D1D1F] tracking-tight leading-tight mb-3">
            Welcome Back
          </h1>
          <p className="text-[15px] text-[#5E6C84] font-medium">
            Sign in to access your SIMATS SeatSync account
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8 sm:p-10 backdrop-blur-2xl bg-white/85 border-white shadow-[0_20px_60px_rgba(0,100,200,0.12)]">
          <form onSubmit={handleEmailLogin} className="space-y-5">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[14px] font-semibold animate-[slideDown_0.3s_ease-out]">
                <style>{`
                  @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                `}</style>
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="email" className="block text-[13px] font-bold text-[#1D1D1F] mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-[#3B9EFF]/20"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-[13px] font-bold text-[#1D1D1F] mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-12 transition-all duration-200 focus:ring-2 focus:ring-[#3B9EFF]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-black/5 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={18} className="text-[#5E6C84]" />
                  ) : (
                    <Eye size={18} className="text-[#5E6C84]" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-6 group"
              isLoading={loading}
            >
              <span className="flex items-center justify-center gap-2">
                Sign In
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white/90 text-[#86868B] text-[13px] font-bold uppercase tracking-wide">or</span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="secondary"
            className="w-full flex items-center justify-center gap-3 hover:border-[#3B9EFF]/30 transition-all"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Register Link */}
          <p className="mt-7 text-center text-[14px] text-[#5E6C84]">
            Don't have an account?{' '}
            <Link
              to={redirectTo ? `/register?redirect=${encodeURIComponent(redirectTo)}` : "/register"}
              className="text-[#3B9EFF] font-bold hover:text-[#007AFF] transition-colors underline-offset-2 hover:underline"
            >
              Create one
            </Link>
          </p>
        </Card>

        {/* Trust Badge */}
        <div className="mt-6 text-center">
          <p className="text-[12px] text-[#86868B] font-medium">
            Secured by SIMATS Engineering College
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
