'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import WheatLogo from '@/components/WheatLogo';
import FormInput from '@/components/FormInput';
import { User, Phone, Mail, Lock, Loader2, CheckCircle2, Truck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

export default function SupplierRegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errs.fullName = t('validation.nameRequired', 'Full Name is required (at least 2 characters).');
    }

    const cleanMobile = formData.mobile.replace(/[\s-]/g, '');
    if (!cleanMobile) {
      errs.mobile = t('validation.mobileRequired', 'Mobile number is required.');
    } else if (!/^[6-9]\d{9}$/.test(cleanMobile) && !/^\d{10}$/.test(cleanMobile)) {
      errs.mobile = t('validation.validMobile', 'Please enter a valid 10-digit mobile number.');
    }

    if (!formData.email.trim()) {
      errs.email = t('validation.emailRequired', 'Email Address is required.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = t('validation.validEmail', 'Please enter a valid email address.');
    }

    if (!formData.password) {
      errs.password = t('validation.passwordRequired', 'Create Password is required.');
    } else if (formData.password.length < 6) {
      errs.password = t('validation.passwordMinLength', 'Password must be at least 6 characters long.');
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = t('validation.passwordInputRequired', 'Confirm Password is required.');
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = t('validation.passwordsMismatch', 'Passwords do not match.');
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError('');
    setSuccessMsg('');

    try {
      await register({
        role: 'supplier',
        fullName: formData.fullName.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      setSuccessMsg('Registration successful! Redirecting to Supplier Dashboard...');
      setTimeout(() => {
        router.push('/supplier/dashboard');
      }, 1000);
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
      }
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper supplier-theme">
      {/* Background illustration */}
      <div
        className="auth-bg-overlay"
        style={{ backgroundImage: `url('/images/farmer_bg.jpg')` }}
      />

      <div className="auth-container">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
          <LanguageSelector variant="compact" />
        </div>

        {/* Header Branding */}
        <div className="auth-header">
          <div className="auth-logo-center">
            <WheatLogo size={52} href="/" />
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Truck size={24} className="text-amber-600" />
            <h1 className="auth-title orange-title">{t('auth.supplierRegisterTitle', 'Supplier Registration')}</h1>
          </div>
          <p className="auth-tagline">{t('auth.supplierRegisterTagline', 'Agri-supplies • Equipment • Seeds & Logistics')}</p>
        </div>

        {/* Floating White Card */}
        <div className="auth-card">
          {serverError && (
            <div className="alert-banner error-banner">
              <span>{serverError}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert-banner success-banner flex items-center gap-2">
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <FormInput
              id="fullName"
              name="fullName"
              type="text"
              placeholder={t('auth.fullNamePlaceholder', 'Full Name')}
              icon={User}
              value={formData.fullName}
              onChange={handleChange}
              error={errors.fullName}
              disabled={loading}
              autoComplete="name"
              required
            />

            <FormInput
              id="mobile"
              name="mobile"
              type="tel"
              placeholder={t('auth.mobilePlaceholder', '10-digit mobile number')}
              icon={Phone}
              value={formData.mobile}
              onChange={handleChange}
              error={errors.mobile}
              disabled={loading}
              autoComplete="tel"
              required
            />

            <FormInput
              id="email"
              name="email"
              type="email"
              placeholder={t('auth.emailPlaceholder', 'Email Address')}
              icon={Mail}
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              disabled={loading}
              autoComplete="email"
              required
            />

            <FormInput
              id="password"
              name="password"
              type="password"
              placeholder={t('auth.passwordPlaceholder', 'Create Password')}
              icon={Lock}
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              disabled={loading}
              autoComplete="new-password"
              required
            />

            <FormInput
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder={t('auth.confirmPasswordPlaceholder', 'Confirm Password')}
              icon={Lock}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              disabled={loading}
              autoComplete="new-password"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="btn btn-supplier-login w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" /> {t('auth.registering', 'Registering...')}
                </span>
              ) : (
                t('common.register', 'Register')
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="auth-footer-text">
            <span>{t('auth.alreadyHaveAccount', 'Already have an account?')} </span>
            <Link href="/supplier/login" className="auth-link orange-link">
              {t('auth.loginHere', 'Login here')}
            </Link>
          </div>
        </div>

        <div className="wave-footer-band supplier-waves" />
      </div>
    </div>
  );
}
