'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import WheatLogo from '@/components/WheatLogo';
import FormInput from '@/components/FormInput';
import { Lock, Loader2, User, KeyRound, X } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!identifier.trim()) {
      errs.identifier = 'Please enter your Mobile Number or Email.';
    }
    if (!password) {
      errs.password = 'Please enter your password.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      await login(identifier, password, 'admin');
      router.push('/admin/dashboard');
    } catch (err) {
      setServerError(err.message || 'Invalid email/mobile or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotInput.trim()) return;

    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotInput, role: 'admin' }),
      });
      const data = await res.json();
      setForgotMessage(data.message || 'Reset instructions dispatched.');
    } catch {
      setForgotMessage('Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper admin-theme">
      <div
        className="auth-bg-overlay"
        style={{ backgroundImage: `url('/images/admin_bg.jpg')` }}
      />

      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo-center">
            <WheatLogo size={52} href="/" />
          </div>
          <h1 className="auth-title purple-title">Admin Login</h1>
          <p className="auth-tagline">Restricted administrative access & oversight</p>
        </div>

        <div className="auth-card">
          {serverError && (
            <div className="alert-banner error-banner">
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <FormInput
              id="identifier"
              name="identifier"
              type="text"
              placeholder="Mobile Number or Email"
              icon={User}
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: '' }));
                if (serverError) setServerError('');
              }}
              error={errors.identifier}
              disabled={loading}
              autoComplete="username"
              required
            />

            <FormInput
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              icon={Lock}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                if (serverError) setServerError('');
              }}
              error={errors.password}
              disabled={loading}
              autoComplete="current-password"
              required
            />

            <div className="auth-options-row">
              <button
                type="button"
                onClick={() => {
                  setForgotInput(identifier);
                  setShowForgotModal(true);
                }}
                className="forgot-password-link"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-admin-login w-full mt-3"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" /> Logging in...
                </span>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <div className="auth-footer-text">
            <span>Don't have an account? </span>
            <Link href="/admin/register" className="auth-link purple-link">
              Register here
            </Link>
          </div>
        </div>

        <div className="wave-footer-band admin-waves" />
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <KeyRound size={20} className="text-purple-700" />
                <h3 className="font-bold text-lg">Reset Admin Password</h3>
              </div>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotMessage('');
                }}
                className="text-secondary hover:text-dark"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {forgotMessage ? (
              <div className="p-4 text-center">
                <p className="text-sm text-secondary mb-4">{forgotMessage}</p>
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotMessage('');
                  }}
                  className="btn btn-primary w-full"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="p-4 flex flex-col gap-4">
                <p className="text-xs text-secondary">
                  Enter your registered mobile number or email address and we'll send you reset instructions.
                </p>
                <FormInput
                  id="forgotInput"
                  name="forgotInput"
                  type="text"
                  placeholder="Registered Mobile or Email"
                  icon={User}
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn btn-admin-login w-full"
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
