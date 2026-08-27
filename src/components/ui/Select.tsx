import { forwardRef, type SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || props.name || Math.random().toString(36).slice(2);

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#1a1a1a] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060] disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer ${
            error
              ? 'border-[#d82c0d] focus:ring-[#d82c0d]/30'
              : 'border-[#e1e3e5]'
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-[#d82c0d] mt-0.5">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
