"use client";

const NumberTilePicker = ({ label, required, hint, value, onChange, options }) => (
  <div>
    {label && (
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {label}
        {required && <span className="text-[#ff5b00] ml-0.5">*</span>}
      </label>
    )}
    <div className="flex gap-2">
      {options.map((opt) => {
        const selected = String(value) === String(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(String(opt.value))}
            className={`
              w-12 h-12 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-0.5
              transition-all duration-150 cursor-pointer select-none flex-shrink-0
              ${selected
                ? "border-[#ff5b00] bg-[#ff5b00] text-white shadow-[0_4px_12px_-2px_rgba(255,91,0,0.45)]"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }
            `}
          >
            <span className="text-base leading-none">{opt.label}</span>
            {opt.sub && (
              <span className={`text-[9px] font-semibold leading-none ${selected ? "text-white/70" : "text-gray-400"}`}>
                {opt.sub}
              </span>
            )}
          </button>
        );
      })}
    </div>
    {hint && <p className="text-[11px] text-gray-400 mt-1.5">{hint}</p>}
  </div>
);

export default NumberTilePicker;
