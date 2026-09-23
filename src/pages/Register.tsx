// Register Page Component - Premium Redesign
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  registerWithEmail,
  loginWithGoogle,
  createUserDocument,
  checkRegNoExists,
  getUserDocument,
  ADMIN_EMAIL
} from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Eye, EyeOff, UserCircle, Briefcase, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';

const DEPARTMENTS = [
  { value: '', label: 'Select Department' },
  { value: 'AIML', label: 'AIML' },
  { value: 'AIDS', label: 'AIDS' },
  { value: 'CSE', label: 'CSE' },
  { value: 'CSE(AI)', label: 'CSE(AI)' },
  { value: 'CSE(DS)', label: 'CSE(DS)' },
  { value: 'IT', label: 'IT' },
  { value: 'ECE', label: 'ECE' },
  { value: 'EEE', label: 'EEE' },
  { value: 'BME', label: 'BME' },
  { value: 'BI', label: 'BI' },
  { value: 'CYBER SECURITY', label: 'CYBER SECURITY' }
];

const ROLES = [
  { value: 'student', label: 'Student', icon: GraduationCap, description: 'Browse events and book your seat' },
  { value: 'coordinator', label: 'Event Coordinator', icon: Briefcase, description: 'Create and manage events' }
];

export const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isGoogleRedirect = searchParams.get('google') === 'true';
  const prefilledEmail = searchParams.get('email') || '';
  const prefilledName = searchParams.get('name') || '';
  const redirectTo = searchParams.get('redirect') || '';

  const [formData, setFormData] = useState({
    name: prefilledName,
    email: prefilledEmail,
    password: '',
    confirmPassword: '',
    regNo: '',
    department: '',
    role: 'student' as 'student' | 'coordinator'
  });
  const [roleChosen, setRoleChosen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, userData, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user && userData) {
      if (redirectTo) navigate(redirectTo);
      else if (userData.role === 'admin') navigate('/admin');
      else if (userData.role === 'coordinator') navigate('/coordinator');
      else navigate('/student');
    }
  }, [user, userData, authLoading, navigate, redirectTo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.role === 'student') {
      if (!formData.regNo.trim()) {
        setError('Register number is required');
        return false;
      }
      if (!formData.department) {
        setError('Please select a department');
        return false;
      }
    }
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (formData.role === 'student') {
        const regNoExists = await checkRegNoExists(formData.regNo);
        if (regNoExists) {
          setError('This register number is already registered');
          setLoading(false);
          return;
        }
      }

      const result = await registerWithEmail(formData.email, formData.password);
      const role = formData.email === ADMIN_EMAIL ? 'admin' : formData.role;

      await createUserDocument(result.user.uid, {
        name: formData.name,
        reg_no: formData.role === 'student' ? formData.regNo : '',
        department: formData.role === 'student' ? formData.department : '',
        role: role,
        email: formData.email
      });

      if (redirectTo) navigate(redirectTo);
      else if (role === 'admin') navigate('/admin');
      else if (role === 'coordinator') navigate('/coordinator');
      else navigate('/student');
    } catch (err: unknown) {
      console.error('Registration error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      if (errorMessage.includes('email-already-in-use')) {
        setError('This email is already registered');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await loginWithGoogle();
      const userDoc = await getUserDocument(result.user.uid);

      if (userDoc) {
        const existingUser = userDoc as { id: string; role: string };
        if (redirectTo) navigate(redirectTo);
        else if (existingUser.role === 'admin') navigate('/admin');
        else if (existingUser.role === 'coordinator') navigate('/coordinator');
        else navigate('/student');
      } else {
        const googleEmail = result.user.email || '';
        const googleName = result.user.displayName || '';

        await import('@/lib/firebase').then(m => m.logout());

        setFormData(prev => ({
          ...prev,
          name: googleName,
          email: googleEmail
        }));

        navigate(`/register?email=${encodeURIComponent(googleEmail)}&name=${encodeURIComponent(googleName)}&google=true${redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : ''}`, { replace: true });
      }
    } catch (err: unknown) {
      console.error('Google sign up error:', err);
      setError('Google sign up failed. Please try again.');
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
            Create Account
          </h1>
          <p className="text-[15px] text-[#5E6C84] font-medium">
            Join SIMATS SeatSync and register for workshops
          </p>
        </div>

        {/* Step 1: Choose Role */}
        {!roleChosen ? (
          <Card className="p-8 backdrop-blur-2xl bg-white/85 border-white shadow-[0_20px_60px_rgba(0,100,200,0.12)]">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#3B9EFF]/10 flex items-center justify-center mx-auto mb-3">
                <UserCircle className="w-6 h-6 text-[#3B9EFF]" strokeWidth={2.5} />
              </div>
              <h2 className="font-extrabold text-[22px] text-[#1D1D1F] mb-2 tracking-tight">
                First, who are you?
              </h2>
              <p className="text-[14px] text-[#5E6C84] font-medium">
                This decides what details we need from you
              </p>
            </div>

            <div className="space-y-3">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      role: r.value as 'student' | 'coordinator',
                      regNo: r.value === 'student' ? prev.regNo : '',
                      department: r.value === 'student' ? prev.department : '',
                    }));
                    setError('');
                    setRoleChosen(true);
                  }}
                  className="w-full p-5 rounded-2xl bg-white/70 hover:bg-white border-2 border-white hover:border-[#3B9EFF]/30 shadow-sm hover:shadow-md transition-all text-left group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3B9EFF] to-[#007AFF] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <r.icon className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <p className="font-extrabold text-[16px] text-[#1D1D1F] mb-0.5">{r.label}</p>
                      <p className="text-[13px] text-[#5E6C84] font-medium">{r.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#3B9EFF] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
                  </div>
                </button>
              ))}
            </div>

            <p className="mt-7 text-center text-[14px] text-[#5E6C84]">
              Already have an account?{' '}
              <Link
                to={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}
                className="text-[#3B9EFF] font-bold hover:text-[#007AFF] transition-colors underline-offset-2 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </Card>
        ) : (
          <Card className="p-8 backdrop-blur-2xl bg-white/85 border-white shadow-[0_20px_60px_rgba(0,100,200,0.12)]">
            {/* Role Badge */}
            <div className="flex items-center justify-between p-4 mb-6 rounded-2xl bg-gradient-to-r from-[#3B9EFF]/5 to-[#007AFF]/5 border border-[#3B9EFF]/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B9EFF] to-[#007AFF] flex items-center justify-center">
                  {formData.role === 'student' ? (
                    <GraduationCap className="w-5 h-5 text-white" strokeWidth={2} />
                  ) : (
                    <Briefcase className="w-5 h-5 text-white" strokeWidth={2} />
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#3B9EFF] uppercase tracking-wider">Signing up as</p>
                  <p className="font-extrabold text-[15px] text-[#1D1D1F]">
                    {ROLES.find((r) => r.value === formData.role)?.label}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setRoleChosen(false); setError(''); }}
                className="text-[13px] font-bold text-[#3B9EFF] hover:text-[#007AFF] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#3B9EFF]/5"
              >
                Change
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {isGoogleRedirect && (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-[13px] font-semibold animate-[slideDown_0.3s_ease-out]">
                  <style>{`
                    @keyframes slideDown {
                      from { opacity: 0; transform: translateY(-10px); }
                      to { opacity: 1; transform: translateY(0); }
                    }
                  `}</style>
                  Please complete your registration with your details below.
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[13px] font-semibold animate-[slideDown_0.3s_ease-out]">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-[13px] font-bold text-[#1D1D1F] mb-2">
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-[13px] font-bold text-[#1D1D1F] mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="password" className="block text-[13px] font-bold text-[#1D1D1F] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Create password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-black/5 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff size={16} className="text-[#5E6C84]" />
                      ) : (
                        <Eye size={16} className="text-[#5E6C84]" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-[13px] font-bold text-[#1D1D1F] mb-2">
                    Confirm
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Repeat password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-black/5 transition-colors"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} className="text-[#5E6C84]" />
                      ) : (
                        <Eye size={16} className="text-[#5E6C84]" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {formData.role === 'student' && (
                <>
                  <div>
                    <label htmlFor="regNo" className="block text-[13px] font-bold text-[#1D1D1F] mb-2">
                      Register Number
                    </label>
                    <Input
                      id="regNo"
                      type="text"
                      name="regNo"
                      placeholder="Enter your register number"
                      value={formData.regNo}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="department" className="block text-[13px] font-bold text-[#1D1D1F] mb-2">
                      Department
                    </label>
                    <Select
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      options={DEPARTMENTS}
                      required
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2 group"
                isLoading={loading}
              >
                <span className="flex items-center justify-center gap-2">
                  Create Account
                  <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white/90 text-[#86868B] text-[13px] font-bold uppercase tracking-wide">or</span>
              </div>
            </div>

            {/* Google Sign Up */}
            <Button
              type="button"
              variant="secondary"
              className="w-full flex items-center justify-center gap-3 hover:border-[#3B9EFF]/30 transition-all"
              onClick={handleGoogleSignUp}
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

            {/* Login Link */}
            <p className="mt-6 text-center text-[14px] text-[#5E6C84]">
              Already have an account?{' '}
              <Link
                to={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}
                className="text-[#3B9EFF] font-bold hover:text-[#007AFF] transition-colors underline-offset-2 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </Card>
        )}

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

export default Register;
