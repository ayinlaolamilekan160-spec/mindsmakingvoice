import React, { useState } from 'react';
import Button from './Button';
import Input from './Input';
import { useAuth } from '../../contexts/AuthContext';

const AuthModal = ({ isOpen, onClose, defaultMode = 'signin' }) => {
  const { signIn, signUp, resetPassword, loading } = useAuth();
  const [mode, setMode] = useState(defaultMode); // 'signin', 'signup', 'reset'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const clearForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: ''
    });
    setErrors({});
    setMessage('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/?.test(formData?.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (mode !== 'reset') {
      if (!formData?.password?.trim()) {
        newErrors.password = 'Password is required';
      } else if (formData?.password?.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (mode === 'signup') {
        if (!formData?.fullName?.trim()) {
          newErrors.fullName = 'Full name is required';
        }

        if (!formData?.confirmPassword?.trim()) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData?.password !== formData?.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific error when user starts typing
    if (errors?.[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setMessage('');

    if (!validateForm()) return;

    try {
      let result;

      if (mode === 'signin') {
        result = await signIn(formData?.email, formData?.password);
      } else if (mode === 'signup') {
        result = await signUp(formData?.email, formData?.password, {
          fullName: formData?.fullName
        });
      } else if (mode === 'reset') {
        result = await resetPassword(formData?.email);
      }

      if (result?.error) {
        setErrors({ general: result?.error });
      } else {
        if (mode === 'signup') {
          setMessage('Please check your email for a confirmation link.');
        } else if (mode === 'reset') {
          setMessage('Password reset link sent to your email.');
        } else {
          clearForm();
          onClose?.();
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    clearForm();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            {mode === 'signin' && 'Sign In'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            iconName="X"
            onClick={() => {
              clearForm();
              onClose?.();
            }}
          />
        </div>

        {errors?.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{errors?.general}</p>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <Input
              label="Full Name"
              name="fullName"
              type="text"
              value={formData?.fullName}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              error={errors?.fullName}
              disabled={loading}
              required
            />
          )}

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData?.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            error={errors?.email}
            disabled={loading}
            required
          />

          {mode !== 'reset' && (
            <Input
              label="Password"
              name="password"
              type="password"
              value={formData?.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              error={errors?.password}
              disabled={loading}
              required
            />
          )}

          {mode === 'signup' && (
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData?.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              error={errors?.confirmPassword}
              disabled={loading}
              required
            />
          )}

          <Button
            type="submit"
            fullWidth
            disabled={loading}
            className="mt-6"
          >
            {loading && 'Processing...'}
            {!loading && mode === 'signin' && 'Sign In'}
            {!loading && mode === 'signup' && 'Create Account'}
            {!loading && mode === 'reset' && 'Send Reset Link'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === 'signin' && (
            <>
              <p className="text-muted-foreground">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-primary hover:underline"
                  disabled={loading}
                >
                  Sign up
                </button>
              </p>
              <p className="mt-2 text-muted-foreground">
                Forgot your password?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="text-primary hover:underline"
                  disabled={loading}
                >
                  Reset it
                </button>
              </p>
            </>
          )}

          {mode === 'signup' && (
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-primary hover:underline"
                disabled={loading}
              >
                Sign in
              </button>
            </p>
          )}

          {mode === 'reset' && (
            <p className="text-muted-foreground">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-primary hover:underline"
                disabled={loading}
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        {/* Demo Credentials */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <h4 className="text-sm font-medium text-foreground mb-2">Demo Credentials:</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Email: demo@mindsmakingvoice.com</p>
            <p>Password: demo123</p>
            <p className="mt-2">Premium: premium@mindsmakingvoice.com / premium123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;