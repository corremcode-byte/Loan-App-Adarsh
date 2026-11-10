'use client';

import React from 'react';
import Link from 'next/link';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  /**
   * When provided the component renders a Next.js <Link> styled as a button
   * instead of a <button> element.  Avoids the invalid <a><button> nesting
   * that occurs when a <Link> wraps a <Button>.
   */
  href?: string;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  href,
  ...props
}: ButtonProps) {
  const baseStyles =
    'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 active:scale-[0.98]';

  const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:
      'bg-navy text-white hover:bg-navy-hover focus:ring-navy/40 shadow-sm',
    secondary:
      'bg-slate-600 text-white hover:bg-slate-700 focus:ring-slate-500/40 shadow-sm',
    outline:
      'border-2 border-navy text-navy hover:bg-navy/5 focus:ring-navy/30',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/40 shadow-sm',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500/40 shadow-sm',
    gold:
      'bg-gold text-navy-dark hover:bg-gold-dark focus:ring-gold/50 shadow-sm font-bold',
  };

  const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'px-3.5 py-1.5 text-sm',
    md: 'px-5   py-2.5 text-sm',
    lg: 'px-7   py-3.5 text-base',
  };

  const combinedClass = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const spinnerEl = loading ? (
    <svg
      className="animate-spin h-4 w-4 flex-shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  ) : null;

  // Render as a Next.js Link when href is supplied
  if (href) {
    return (
      <Link href={href} className={combinedClass}>
        {spinnerEl}
        {children}
      </Link>
    );
  }

  return (
    <button
      className={combinedClass}
      disabled={disabled || loading}
      {...props}
    >
      {spinnerEl}
      {children}
    </button>
  );
}
