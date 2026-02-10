// Register Page Component
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

export const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isGoogleRedirect = searchParams.get('google') === 'true';
  const prefilledEmail = searchParams.get('email') || '';
  const prefilledName = searchParams.get('name') || '';
  
  const [formData, setFormData] = useState({
    name: prefilledName,
    email: prefilledEmail,
    password: '',
    confirmPassword: '',
    regNo: '',
    department: ''
  });
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
    if (!formData.regNo.trim()) {
      setError('Register number is required');
      return false;
    }
    if (!formData.department) {
      setError('Please select a department');
      return false;
    }
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Check if register number already exists
      const regNoExists = await checkRegNoExists(formData.regNo);
      if (regNoExists) {
        setError('This register number is already registered');
        setLoading(false);
        return;
      }

      // Create auth user
      const result = await registerWithEmail(formData.email, formData.password);

      // Determine role - check if this is the admin email
      const role = formData.email === ADMIN_EMAIL ? 'admin' : 'student';

      // Create user document in Firestore
      await createUserDocument(result.user.uid, {
        name: formData.name,
        reg_no: formData.regNo,
        department: formData.department,
        role: role,
        email: formData.email
      });

      // Navigate based on role
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
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
        // User already exists, redirect based on role
        const existingUser = userDoc as { id: string; role: string };
        if (existingUser.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/student');
        }
      } else {
        // Get Google user info and prefill the form
        const googleEmail = result.user.email || '';
        const googleName = result.user.displayName || '';
        
        // Sign out since user needs to complete registration form
        await import('@/lib/firebase').then(m => m.logout());
        
        // Update form with Google data
        setFormData(prev => ({
          ...prev,
          name: googleName,
          email: googleEmail
        }));
        
        // Update URL to show google redirect state
        navigate(`/register?email=${encodeURIComponent(googleEmail)}&name=${encodeURIComponent(googleName)}&google=true`, { replace: true });
      }
    } catch (err: unknown) {
      console.error('Google sign up error:', err);
      setError('Google sign up failed. Please try again.');
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
            Create Account
          </h1>
          <p className="mt-3 text-[#6B7280]">
            Join SIMATS SeatSync and register for workshops
          </p>
        </div>

        {/* Register Card */}
        <Card className="p-10">
          <form onSubmit={handleRegister} className="space-y-5">
            {isGoogleRedirect && (
              <div className="p-4 rounded-2xl bg-blue-50 text-blue-700 text-sm shadow-[inset_3px_3px_6px_rgba(100,100,255,0.1),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Please complete your registration with your details below.
                </div>
              </div>
            )}
            
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm shadow-[inset_3px_3px_6px_rgba(255,100,100,0.1),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]">
                {error}
              </div>
            )}

            <Input
              label="Full Name"
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                name="password"
                placeholder="Create password"
                value={formData.password}
                onChange={handleChange}
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label="Register Number"
              type="text"
              name="regNo"
              placeholder="Enter your register number"
              value={formData.regNo}
              onChange={handleChange}
              required
            />

            <Select
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              options={DEPARTMENTS}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={loading}
            >
              Create Account
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-[2px] bg-[#E0E5EC] shadow-[inset_1px_1px_2px_rgb(163,177,198,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.5)]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-[#E0E5EC] text-[#6B7280] text-sm">or sign up with</span>
            </div>
          </div>

          {/* Google Sign Up */}
          <Button
            type="button"
            variant="secondary"
            className="w-full flex items-center justify-center gap-3"
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
          <p className="mt-8 text-center text-[#6B7280]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#6C63FF] font-medium hover:underline">
              Sign in here
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Register;
