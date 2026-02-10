// Login Page Component
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { loginWithEmail, loginWithGoogle, getUserDocument, logout as firebaseLogout, createOrUpdateUserDocument } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, userData, loading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && userData) {
      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    }
  }, [user, userData, authLoading, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginWithEmail(email, password);
      const userEmail = result.user.email || '';
      
      // Use createOrUpdateUserDocument which handles admin email check
      const userDoc = await createOrUpdateUserDocument(
        result.user.uid,
        userEmail,
        { name: result.user.displayName || 'User' }
      );
      
      if (userDoc.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
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
        // Use createOrUpdateUserDocument to handle admin email check
        const updatedDoc = await createOrUpdateUserDocument(
          result.user.uid,
          userEmail,
          { name: result.user.displayName || 'User' }
        );
        
        if (updatedDoc.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/student');
        }
      } else {
        // User doesn't exist, redirect to register with prefilled Google data
        const googleName = result.user.displayName || '';
        // Sign out since we need them to complete registration
        await firebaseLogout();
        navigate(`/register?email=${encodeURIComponent(userEmail)}&name=${encodeURIComponent(googleName)}&google=true`);
      }
    } catch (err: unknown) {
      console.error('Google login error:', err);
      setError('Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-[#6C63FF] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E0E5EC] py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C63FF] to-[#8B84FF] flex items-center justify-center shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </Link>
          <h1 className="font-display font-extrabold text-4xl text-[#3D4852] tracking-tight">
            Welcome Back
          </h1>
          <p className="mt-3 text-[#6B7280]">
            Sign in to access your SIMATS SeatSync account
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-10">
          <form onSubmit={handleEmailLogin} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm shadow-[inset_3px_3px_6px_rgba(255,100,100,0.1),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]">
                {error}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={loading}
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-[2px] bg-[#E0E5EC] shadow-[inset_1px_1px_2px_rgb(163,177,198,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.5)]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-[#E0E5EC] text-[#6B7280] text-sm">or continue with</span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="secondary"
            className="w-full flex items-center justify-center gap-3"
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
          <p className="mt-8 text-center text-[#6B7280]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#6C63FF] font-medium hover:underline">
              Register here
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Login;
