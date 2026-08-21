'use client';

import { useState } from 'react';
import Image from 'next/image';
import api from '@utils/api';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import {
  Eye, EyeOff, BookOpen, Users, BarChart3,
  Award, Zap, ChevronRight, GraduationCap,
} from 'lucide-react';
import ABCLogo from '@/assets/images/ABClogo.png';

const COOKIE_EXPIRY_DAYS = 6 / 24;

const FEATURES = [
  { icon: BookOpen,  label: 'Course Management', desc: 'Build and publish rich course content with ease' },
  { icon: Users,     label: 'Learner Analytics',  desc: 'Track progress and performance across all batches' },
  { icon: BarChart3, label: 'Live Sessions',       desc: 'Schedule, conduct and record live classes' },
  { icon: Award,     label: 'Certificates',        desc: 'Auto-generate and issue verified certificates' },
];

const STATS = [
  { value: '500+', label: 'Courses'     },
  { value: '10K+', label: 'Students'    },
  { value: '50+',  label: 'Instructors' },
  { value: '95%',  label: 'Placement'   },
];

export default function AdminLoginForm() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, status } = await api.post('/api/user/login', { email: trimmedEmail, password });

      if (status !== 200) { setError('Invalid credentials. Please try again.'); return; }

      const { accessToken, sessionId, email: userEmail, role, userId } = data;
      const userRole = Array.isArray(role) ? role[0] : role;

      if (userRole !== 'ADMIN') {
        setError('Access denied. This portal is for administrators only.');
        return;
      }

      Cookies.set('accessToken', accessToken, { expires: COOKIE_EXPIRY_DAYS });
      Cookies.set('userEmail',   userEmail,   { expires: COOKIE_EXPIRY_DAYS });
      Cookies.set('userId',      userId,      { expires: COOKIE_EXPIRY_DAYS });
      Cookies.set('JSESSIONID',  sessionId,   { expires: COOKIE_EXPIRY_DAYS });
      localStorage.setItem('authToken', accessToken);

      toast.success('Signed in successfully');
      window.location.href = '/admin/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">

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
                ATOMS LMS &middot; Admin Portal
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[2.6rem] xl:text-[3rem] font-extrabold text-white leading-[1.12] mb-5">
              Power Your<br />
              <span
                style={{
                  background: 'linear-gradient(90deg,#FF5B00 0%,#ff8c42 55%,#ffb870 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Learning Operations
              </span>
            </h1>

            <p className="text-[0.95rem] leading-relaxed max-w-[420px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Everything you need to run a world-class training institute &mdash; courses,
              batches, live sessions, assessments, and certificates in one place.
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
            <p className="text-sm text-gray-500 mt-1.5">Sign in to your admin account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@abc.courses"
                disabled={isLoading}
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
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
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

            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
              >
                <span className="shrink-0 mt-0.5">&#9888;</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 flex items-center justify-center gap-2 py-3.5 px-4 text-white text-sm font-bold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg,#FF5B00 0%,#ff7a30 100%)',
                boxShadow: isLoading ? 'none' : '0 8px 24px rgba(255,91,0,0.28)',
              }}
            >
              {isLoading ? (
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
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[11px] font-semibold text-gray-400 tracking-widest">ADMIN ACCESS ONLY</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Security notice */}
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#8b4a18' }}>
              This portal is restricted to authorized administrators of ABC Technology
              Training &amp; Upskilling. All sessions are monitored.
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            &copy; {new Date().getFullYear()} ABC Technology Training &amp; Upskilling
          </p>
        </div>
      </div>

    </div>
  );
}
