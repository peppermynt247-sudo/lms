import React from 'react';

const COLOR_MAP = {
  'text-primary':    { bg: 'rgba(255,91,0,0.08)',    icon: '#ff5b00'  },
  'text-blue-500':   { bg: 'rgba(12,99,228,0.08)',   icon: '#0c63e4'  },
  'text-green-500':  { bg: 'rgba(34,197,94,0.08)',   icon: '#22c55e'  },
  'text-gray-500':   { bg: 'rgba(107,114,128,0.08)', icon: '#6b7280'  },
  'text-red-500':    { bg: 'rgba(239,68,68,0.08)',   icon: '#ef4444'  },
};

const StatCard = ({ icon: Icon, title, value, subtitle, color = 'text-primary' }) => {
  const cfg = COLOR_MAP[color] || COLOR_MAP['text-primary'];

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 p-4 transition-shadow duration-150 hover:shadow-md"
      style={{ boxShadow: '0 1px 6px -1px rgba(26,43,78,0.07)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-xl font-bold text-[#1a2b4e] leading-none">{value}</p>
          {subtitle && <p className="text-[11px] text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: cfg.bg }}
        >
          <Icon className="h-4 w-4" style={{ color: cfg.icon }} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
