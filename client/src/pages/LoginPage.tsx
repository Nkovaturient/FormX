import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<string | null>(null);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus(null);
    setForgotSubmitting(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setForgotStatus('If the email exists, a password reset link has been sent.');
      } else {
        setForgotStatus(data.error || 'Failed to send reset link.');
      }
    } catch (err: any) {
      setForgotStatus('Failed to send reset link.');
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-primary-700">Log In</h2>
        {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded p-2 mb-4 text-sm">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 border border-green-200 rounded p-2 mb-4 text-sm">Login successful! Redirecting...</div>}
        {!showForgot ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="input w-full"
                required
                autoComplete="email"
              />
              <input
                name="password"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="input w-full"
                required
                autoComplete="current-password"
              />
              <button
                type="submit"
                className="btn-primary w-full mt-2"
                disabled={isLoading || submitting}
              >
                {submitting ? 'Logging in...' : 'Log In'}
              </button>
            </form>
            <div className="flex justify-between items-center mt-4 text-sm">
              <button
                type="button"
                className="text-primary-600 hover:underline focus:outline-none"
                onClick={() => setShowForgot(true)}
              >
                Forgot password?
              </button>
              <span>
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary-600 hover:underline">Sign up</Link>
              </span>
            </div>
          </>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="text-sm text-gray-700 mb-2">Enter your email to reset your password:</div>
            <input
              name="forgotEmail"
              type="email"
              placeholder="Email"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              className="input w-full"
              required
              autoComplete="email"
            />
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={forgotSubmitting}
            >
              {forgotSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button
              type="button"
              className="w-full text-gray-500 hover:underline text-xs mt-2"
              onClick={() => { setShowForgot(false); setForgotStatus(null); }}
            >
              Back to login
            </button>
            {forgotStatus && <div className="text-center text-sm mt-2 text-primary-700">{forgotStatus}</div>}
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage; 