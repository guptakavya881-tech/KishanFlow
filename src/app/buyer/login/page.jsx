'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import WheatLogo from '@/components/WheatLogo';
import FormInput from '@/components/FormInput';
import { Mail, Lock, Loader2, KeyRound, X } from 'lucide-react';

export default function BuyerLoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
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
    if (!email.trim()) {
      errs.email = 'Please enter your email address.';
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
      await login(email, password, 'buyer');
      router.push('/buyer/dashboard');
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
        body: JSON.stringify({ identifier: forgotInput, role: 'buyer' }),
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
    <div className="auth-page-wrapper buyer-theme">
      <div
        className="auth-bg-overlay"
        style={{ backgroundImage: `url('/images/buyer_bg.jpg')` }}
      />

      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo-center">
            <WheatLogo size={52} href="/" />
          </div>
          <h1 className="auth-title gold-title">Buyer Login</h1>
          <p className="auth-tagline">Access fresh harvests from verified growers</p>
        </div>

        <div className="auth-card">
          {serverError && (
            <div className="alert-banner error-banner">
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <FormInput
              id="email"
              name="email"
              type="email"
              placeholder="Email Address"
              icon={Mail}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                if (serverError) setServerError('');
              }}
              error={errors.email}
              disabled={loading}
              autoComplete="email"
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
                  setForgotInput(email);
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
              className="btn btn-buyer-register w-full mt-3"
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
            <Link href="/buyer/register" className="auth-link gold-link">
              Register here
            </Link>
          </div>
        </div>

        <div className="wave-footer-band buyer-waves" />
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <KeyRound size={20} className="text-gold" />
                <h3 className="font-bold text-lg">Reset Buyer Password</h3>
              </div>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotMessage('');
                }}
                className="text-secondary hover:text-dark"
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
                  Enter your registered email address and we'll send you reset instructions.
                </p>
                <FormInput
                  id="forgotInput"
                  name="forgotInput"
                  type="email"
                  placeholder="Registered Email"
                  icon={Mail}
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn btn-buyer-register w-full"
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
