'use client';

import React, { useId } from 'react';

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
  const generatedId = useId();
  const inputId   = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
  const errorId   = `${inputId}-error`;
  const helperId  = `${inputId}-helper`;

  // Build aria-describedby from whichever elements are present
  const describedBy = [
    error      ? errorId  : null,
    helperText ? helperId : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-foreground mb-1.5"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full px-4 py-2.5 border rounded-lg text-foreground transition-all duration-200 focus:outline-none focus:ring-2 placeholder:text-slate-400 ${
          error
            ? 'border-red-400 focus:ring-red-200 focus:border-red-400 bg-red-50/30'
            : 'border-slate-200 hover:border-slate-300 focus:ring-navy/20 focus:border-navy'
        } ${
          props.disabled
            ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
            : 'bg-white'
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-red-500">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1.5 text-xs text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
}
