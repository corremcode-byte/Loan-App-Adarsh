'use client';

interface LogoProps {
  /** 'sm' = 32px icon, 'md' = 40px icon (default) */
  size?: 'sm' | 'md';
  /**
   * 'light' (default) — navy icon background, dark text — for white headers.
   * 'dark' — translucent white icon background, white text — for dark footers.
   */
  theme?: 'light' | 'dark';
}

export default function Logo({ size = 'md', theme = 'light' }: LogoProps) {
  const iconSize  = size === 'sm' ? 'w-8 h-8'  : 'w-10 h-10';
  const svgSize   = size === 'sm' ? 'w-5 h-5'  : 'w-6 h-6';
  const textSize  = size === 'sm' ? 'text-lg'  : 'text-xl';
  const iconBg    = theme === 'dark' ? 'bg-white/15' : 'bg-navy';
  const textColor = theme === 'dark' ? 'text-white'  : 'text-foreground';

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${iconSize} ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <svg className={`${svgSize} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <span className={`${textSize} font-bold tracking-tight ${textColor}`}>LoanEase</span>
    </div>
  );
}
