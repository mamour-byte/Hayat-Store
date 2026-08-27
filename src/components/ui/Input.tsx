import React, { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).slice(2);

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7175] pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#1a1a1a] placeholder:text-[#8c9196] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060] disabled:opacity-50 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-9' : ''
            } ${rightIcon ? 'pr-9' : ''} ${
              error
                ? 'border-[#d82c0d] focus:ring-[#d82c0d]/30'
                : 'border-[#e1e3e5]'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6d7175]">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-[#d82c0d] mt-0.5">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
