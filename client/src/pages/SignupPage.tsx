import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const industries = [
  '', 'Education', 'Healthcare', 'Finance', 'Technology', 'Retail', 'Other'
];

const SignupPage: React.FC = () => {
  const { register, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    company: '',
    industry: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return 'First and last name required.';
    if (!form.email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) return 'Valid email required.';
    if (!form.password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/))
      return 'Password must be 8+ chars, include upper/lowercase, number, and special character.';
    if (form.company.length > 100) return 'Company name too long.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setSubmitting(true);
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-primary-700">Sign Up</h2>
        {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded p-2 mb-4 text-sm">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 border border-green-200 rounded p-2 mb-4 text-sm">Registration successful! Redirecting...</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <input
              name="firstName"
              type="text"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange}
              className="input flex-1"
              required
              autoComplete="given-name"
            />
            <input
              name="lastName"
              type="text"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleChange}
              className="input flex-1"
              required
              autoComplete="family-name"
            />
          </div>
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
            autoComplete="new-password"
          />
          <input
            name="company"
            type="text"
            placeholder="Company (optional)"
            value={form.company}
            onChange={handleChange}
            className="input w-full"
            maxLength={100}
          />
          <select
            name="industry"
            value={form.industry}
            onChange={handleChange}
            className="input w-full"
          >
            {industries.map((ind) => (
              <option key={ind} value={ind}>{ind || 'Select Industry (optional)'}</option>
            ))}
          </select>
          <button
            type="submit"
            className="btn-primary w-full mt-2"
            disabled={isLoading || submitting}
          >
            {submitting ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <div className="text-center text-sm mt-6 text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:underline">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage; 