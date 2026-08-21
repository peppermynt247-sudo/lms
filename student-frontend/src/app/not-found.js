"use client";
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="h-screen overflow-hidden flex flex-col items-center justify-center bg-white px-6">
      <p className="text-8xl font-extrabold text-gray-100 select-none">404</p>
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 -mt-4"
        style={{
          background: 'linear-gradient(135deg,#FF5B00 0%,#ff7a30 100%)',
          boxShadow: '0 14px 32px rgba(255,91,0,0.25)',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Page not found</h1>
      <p className="text-sm text-gray-500 text-center max-w-xs mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link
          href="/student/dashboard"
          className="flex-1 text-center py-3 px-5 text-sm font-bold text-white rounded-xl transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg,#FF5B00 0%,#ff7a30 100%)' }}
        >
          Go to Dashboard
        </Link>
        <button
          onClick={() => window.history.back()}
          className="flex-1 py-3 px-5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all active:scale-[0.98]"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
