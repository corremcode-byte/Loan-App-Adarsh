'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-[#1E293B] mb-1.5"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-2.5 border rounded-lg text-[#1E293B] transition-all duration-200 focus:outline-none focus:ring-2 placeholder:text-slate-400 ${
          error
            ? 'border-red-400 focus:ring-red-200 focus:border-red-400 bg-red-50/30'
            : 'border-slate-200 hover:border-slate-300 focus:ring-[#223265]/20 focus:border-[#223265]'
        } ${
          props.disabled
            ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
            : 'bg-white'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-slate-400">{helperText}</p>
      )}
    </div>
  );
}
