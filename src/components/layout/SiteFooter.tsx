import Link from 'next/link';
import Logo from './Logo';

export default function SiteFooter() {
  return (
    <footer className="bg-navy-dark text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">

        {/* Multi-column grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Logo size="sm" theme="dark" />
            <p className="mt-3 text-sm text-slate-500 leading-relaxed max-w-xs">
              Fast, transparent loan processing for personal and secured loans.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4">
              Quick Links
            </p>
            <ul className="space-y-2.5">
              {[
                { label: 'Home', href: '/' },
                { label: 'Apply for Loan', href: '/apply' },
                { label: 'EMI Calculator', href: '/emi-calculator' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Access */}
          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4">
              Access
            </p>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/admin/login"
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Team Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider + copyright */}
        <div className="border-t border-white/[0.08] mt-10 pt-6">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} LoanEase. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
