'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '@/store/slices/authSlice';
import {
  Eye, EyeOff, BookOpen, Users, BarChart3,
  Award, Zap, ChevronRight, GraduationCap, X, Mail, KeyRound, ShieldCheck,
} from 'lucide-react';
import ABCLogo from '@/assets/images/ABClogo.png';
import api from '@/services/api';

const FEATURES = [
  { icon: BookOpen,  label: 'Interactive Courses', desc: 'Dive into rich, immersive course content' },
  { icon: Users,     label: 'Community Forums',    desc: 'Connect and collaborate with peers'       },
  { icon: BarChart3, label: 'Live Classes',        desc: 'Join scheduled live lessons dynamically'  },
  { icon: Award,     label: 'Earn Certificates',   desc: 'Get certified upon course completion'     },
];

const STATS = [
  { value: '500+', label: 'Courses'     },
  { value: '10K+', label: 'Students'    },
  { value: '50+',  label: 'Instructors' },
  { value: '95%',  label: 'Placement'   },
];

export default function StudentLoginForm() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData]         = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [inlineError, setInlineError]   = useState('');

  // ── Forgot Password modal state ────────────────────────────────────────────
  const [fpOpen, setFpOpen]                   = useState(false);
  const [fpStep, setFpStep]                   = useState(1); // 1 = email, 2 = otp + new password
  const [fpEmail, setFpEmail]                 = useState('');
  const [fpOtp, setFpOtp]                     = useState('');
  const [fpNewPass, setFpNewPass]             = useState('');
  const [fpConfirmPass, setFpConfirmPass]     = useState('');
  const [fpLoading, setFpLoading]             = useState(false);
  const [fpError, setFpError]                 = useState('');
  const [showNewPass, setShowNewPass]         = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  useEffect(() => {
    if (error) {
      setInlineError(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleChange = (e) => {
    setInlineError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setInlineError('');

    const trimmedEmail = formData.email.trim().toLowerCase();
    if (!trimmedEmail || !formData.password) {
      setInlineError('Please enter your email and password.');
      return;
    }

    try {
      const result = await dispatch(loginUser({ email: trimmedEmail, password: formData.password })).unwrap();
      setIsNavigating(true);
      toast.success('Signed in successfully');

      const role = Array.isArray(result.role) ? result.role[0] : result.role;
      switch (role) {
        case 'STUDENT':
          router.push('/student/dashboard');
          break;
        case 'INSTRUCTOR':
          router.push('/instructor');
          break;
        case 'ADMIN':
          router.push('/admin');
          break;
        default:
          router.push('/student/dashboard');
      }
    } catch (err) {
      // error surfaced via Redux → caught in useEffect above
    }
  };

  // ── Forgot Password handlers ───────────────────────────────────────────────
  const closeFpModal = useCallback(() => {
    setFpOpen(false);
    setFpStep(1);
    setFpEmail('');
    setFpOtp('');
    setFpNewPass('');
    setFpConfirmPass('');
    setFpError('');
    setFpLoading(false);
    setShowNewPass(false);
    setShowConfirmPass(false);
  }, []);

  const handleSendOtp = async () => {
    const email = fpEmail.trim().toLowerCase();
    if (!email) { setFpError('Please enter your email address.'); return; }
    setFpLoading(true);
    setFpError('');
    try {
            await api.post('/api/user/forgotpassword', { email });
      setFpStep(2);
      toast.success('OTP sent to your email!');
    } catch (e) {
      setFpError(
        typeof e.response?.data === 'string'
          ? e.response.data
          : 'Email not found. Please check and try again.'
      );
    } finally {
      setFpLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!fpOtp.trim()) { setFpError('Please enter the OTP sent to your email.'); return; }
    if (!fpNewPass || fpNewPass.length < 6) { setFpError('Password must be at least 6 characters.'); return; }
    if (fpNewPass !== fpConfirmPass) { setFpError('Passwords do not match.'); return; }

    setFpLoading(true);
    setFpError('');
    const email = fpEmail.trim().toLowerCase();
    try {
      await api.post('/api/user/verifyotp', { email, otp: fpOtp.trim() });
      await api.post('/api/user/resetpassword', { email, newPassword: fpNewPass });
      toast.success('Password reset successfully! You can now sign in with your new password.');
      closeFpModal();
    } catch (e) {
      setFpError(
        typeof e.response?.data === 'string'
          ? e.response.data
          : 'Invalid OTP or an error occurred. Please try again.'
      );
    } finally {
      setFpLoading(false);
    }
  };

  const busy = loading || isNavigating;

  return (
    <div className="min-h-screen flex bg-white overflow-x-hidden">

      {/* ── LEFT PANEL — Branding ─────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[58%] relative flex-col overflow-hidden"
        style={{ background: 'linear-gradient(145deg,#080a1e 0%,#0f1230 35%,#161c45 65%,#0b0e28 100%)' }}
      >
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Orange glow — top right */}
        <div
          className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(255,91,0,0.18) 0%,transparent 65%)' }}
        />

        {/* Orange glow — bottom left */}
        <div
          className="absolute -bottom-28 -left-28 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(255,91,0,0.12) 0%,transparent 65%)' }}
        />

        {/* Decorative rings */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ border: '1px solid rgba(255,91,0,0.05)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{ border: '1px solid rgba(255,91,0,0.09)' }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-12 xl:px-16 py-10">
          {/* Logo */}
          <Image
            src={ABCLogo}
            alt="ABC Courses"
            height={36}
            width={140}
            className="h-9 w-auto object-contain brightness-0 invert"
          />

          <div className="mt-14 flex-1">
            {/* Pill badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-7"
              style={{ background: 'rgba(255,91,0,0.12)', border: '1px solid rgba(255,91,0,0.28)' }}
            >
              <Zap className="w-3.5 h-3.5" style={{ color: '#ff8a50' }} />
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#ffaa80' }}>
                ATOMS LMS &middot; Student Portal
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[2.6rem] xl:text-[3rem] font-extrabold text-white leading-[1.12] mb-5">
              Accelerate Your <br />
              <span
                style={{
                  background: 'linear-gradient(90deg,#FF5B00 0%,#ff8c42 55%,#ffb870 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Learning Journey
              </span>
            </h1>

            <p className="text-[0.95rem] leading-relaxed max-w-[420px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Unlock your potential with world-class training. Access live sessions,
              assignments, and verified certificates all in one place.
            </p>

            {/* Feature cards */}
            <div className="mt-10 grid grid-cols-2 gap-3">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 rounded-2xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <div
                    className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5"
                    style={{
                      background: 'linear-gradient(135deg,rgba(255,91,0,0.25),rgba(255,91,0,0.08))',
                      border: '1px solid rgba(255,91,0,0.22)',
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: '#ff7a30' }} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-snug">{label}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div
            className="pt-6 mt-4 grid grid-cols-4 gap-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-extrabold text-white">{value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Login form ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-14 xl:px-20">
        <div className="w-full max-w-[390px]">

          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center mb-10">
            <Image src={ABCLogo} alt="ABC Courses" height={32} width={120} className="h-8 w-auto object-contain" />
          </div>

          {/* Icon + heading */}
          <div className="mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
              style={{
                background: 'linear-gradient(135deg,#FF5B00 0%,#ff7a30 100%)',
                boxShadow: '0 14px 32px rgba(255,91,0,0.30)',
              }}
            >
              <GraduationCap className="w-7 h-7 text-white" strokeWidth={1.8} />
            </div>
            <h2 className="text-[1.65rem] font-extrabold text-gray-900 tracking-tight">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-1.5">Sign in to your learning account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="student@abc.courses"
                disabled={busy}
                className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={busy}
                  className="w-full px-4 py-3 pr-12 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {inlineError && (
              <div
                role="alert"
                className="flex items-start gap-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
              >
                <span className="shrink-0 mt-0.5">&#9888;</span>
                <span>{inlineError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full mt-1 flex items-center justify-center gap-2 py-3.5 px-4 text-white text-sm font-bold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg,#FF5B00 0%,#ff7a30 100%)',
                boxShadow: busy ? 'none' : '0 8px 24px rgba(255,91,0,0.28)',
              }}
            >
              {busy ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in&hellip;</span>
                </>
              ) : (
                <>
                  <span>Sign in to Dashboard</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Forgot Password link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setFpOpen(true)}
                className="text-sm font-medium transition-colors"
                style={{ color: '#FF5B00' }}
                onMouseEnter={e => e.currentTarget.style.color = '#cc4800'}
                onMouseLeave={e => e.currentTarget.style.color = '#FF5B00'}
              >
                Forgot Password?
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[11px] font-semibold text-gray-400 tracking-widest">STUDENT ACCESS</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Student portal notice */}
          <div
            className="flex items-start gap-3 rounded-2xl p-4"
            style={{ background: '#fff7f2', border: '1px solid #ffdece' }}
          >
            <div
              className="shrink-0 w-7 h-7 rounded-xl flex items-center justify-center mt-0.5"
              style={{ background: 'rgba(255,91,0,0.12)' }}
            >
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#FF5B00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#8b4a18' }}>
              This portal is for enrolled students of ABC Technology Training &amp; Upskilling.
              Contact your institute if you need access.
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            &copy; {new Date().getFullYear()} ABC Technology Training &amp; Upskilling
          </p>
        </div>
      </div>

      {/* ── Forgot Password Modal ─────────────────────────────────────────── */}
      {fpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeFpModal(); }}
        >
          <div
            className="relative w-full max-w-[420px] rounded-2xl bg-white shadow-2xl overflow-hidden"
            style={{ animation: 'fadeInUp 0.2s ease' }}
          >
            {/* Modal header */}
            <div
              className="px-6 pt-6 pb-5 flex items-start justify-between"
              style={{ borderBottom: '1px solid #f3f4f6' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg,#FF5B00 0%,#ff7a30 100%)', boxShadow: '0 8px 20px rgba(255,91,0,0.25)' }}
                >
                  {fpStep === 1 ? <Mail className="w-5 h-5 text-white" /> : <KeyRound className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {fpStep === 1 ? 'Forgot Password' : 'Reset Password'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {fpStep === 1
                      ? 'Enter your email to receive an OTP'
                      : `OTP sent to ${fpEmail}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeFpModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex px-6 pt-4 gap-2">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className="flex-1 h-1 rounded-full transition-all duration-300"
                  style={{ background: fpStep >= s ? 'linear-gradient(90deg,#FF5B00,#ff7a30)' : '#e5e7eb' }}
                />
              ))}
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">

              {fpStep === 1 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={fpEmail}
                    onChange={(e) => { setFpEmail(e.target.value); setFpError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                    placeholder="student@abc.courses"
                    disabled={fpLoading}
                    autoFocus
                    className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 disabled:opacity-60"
                  />
                </div>
              )}

              {fpStep === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      OTP
                    </label>
                    <input
                      type="text"
                      value={fpOtp}
                      onChange={(e) => { setFpOtp(e.target.value); setFpError(''); }}
                      placeholder="Enter the 6-digit OTP"
                      maxLength={6}
                      disabled={fpLoading}
                      autoFocus
                      className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 disabled:opacity-60 tracking-widest font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={fpNewPass}
                        onChange={(e) => { setFpNewPass(e.target.value); setFpError(''); }}
                        placeholder="Min. 6 characters"
                        disabled={fpLoading}
                        className="w-full px-4 py-3 pr-12 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass((v) => !v)}
                        tabIndex={-1}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={fpConfirmPass}
                        onChange={(e) => { setFpConfirmPass(e.target.value); setFpError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                        placeholder="Re-enter new password"
                        disabled={fpLoading}
                        className="w-full px-4 py-3 pr-12 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-50 disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass((v) => !v)}
                        tabIndex={-1}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Error */}
              {fpError && (
                <div
                  role="alert"
                  className="flex items-start gap-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
                >
                  <span className="shrink-0 mt-0.5">&#9888;</span>
                  <span>{fpError}</span>
                </div>
              )}

              {/* Action button */}
              <button
                type="button"
                onClick={fpStep === 1 ? handleSendOtp : handleResetPassword}
                disabled={fpLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 text-white text-sm font-bold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg,#FF5B00 0%,#ff7a30 100%)',
                  boxShadow: fpLoading ? 'none' : '0 8px 24px rgba(255,91,0,0.28)',
                }}
              >
                {fpLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{fpStep === 1 ? 'Sending OTP\u2026' : 'Resetting\u2026'}</span>
                  </>
                ) : fpStep === 1 ? (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Send OTP</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Reset Password</span>
                  </>
                )}
              </button>

              {/* Back link (step 2 only) */}
              {fpStep === 2 && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setFpStep(1); setFpOtp(''); setFpNewPass(''); setFpConfirmPass(''); setFpError(''); }}
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    &larr; Back &mdash; use a different email
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}
