'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Racket icon for nav
const RacketIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
    <ellipse cx="12" cy="9" rx="7" ry="8" strokeLinecap="round" />
    <line x1="12" y1="17" x2="12" y2="23" strokeLinecap="round" />
    <line x1="9" y1="6" x2="15" y2="6" strokeLinecap="round" opacity="0.5" />
    <line x1="9" y1="9" x2="15" y2="9" strokeLinecap="round" opacity="0.5" />
    <line x1="9" y1="12" x2="15" y2="12" strokeLinecap="round" opacity="0.5" />
    <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const navItems = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    name: 'Strategy',
    href: '/strategy',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    name: 'Practice',
    href: '/practice',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: 'Racket',
    href: '/racket',
    icon: <RacketIcon className="w-5 h-5" />,
  },
  {
    name: 'History',
    href: '/history',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

interface DashboardNavProps {
  onMobileToggle?: () => void;
  isMobileOpen?: boolean;
}

export default function DashboardNav({ onMobileToggle, isMobileOpen: externalMobileOpen }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);

  const isMobileOpen = externalMobileOpen !== undefined ? externalMobileOpen : internalMobileOpen;
  const handleToggle = onMobileToggle || (() => setInternalMobileOpen(!internalMobileOpen));

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      router.push('/');
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={handleToggle}
        className="fixed top-4 left-4 z-50 p-2.5 bg-blue-900 rounded-xl shadow-lg lg:hidden hover:bg-blue-800 transition-all border border-blue-700"
        aria-label="Toggle navigation menu"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={handleToggle}
        />
      )}

      {/* Navigation Sidebar - Deep Blue Yonex Style */}
      <nav
        className={`fixed left-0 top-0 h-full w-64 flex flex-col z-50 transform transition-transform duration-300 lg:translate-x-0 shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ background: 'linear-gradient(180deg, #1a237e 0%, #1565c0 40%, #1a237e 100%)' }}
      >
        {/* Logo Section */}
        <div className="p-6 pb-8" style={{ background: 'linear-gradient(180deg, #0d1457 0%, transparent 100%)' }}>
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center transform group-hover:scale-110 transition-transform duration-300">
              <div className="w-5 h-10 bg-blue-500 -skew-x-12 rounded-sm" />
              <div className="w-5 h-10 bg-green-500 -skew-x-12 -ml-2 rounded-sm" />
            </div>
            <span className="text-xl font-black italic tracking-tighter text-white">
              RALLY<span className="text-green-400">COACH</span>
            </span>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-2 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setInternalMobileOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 group rounded-xl ${
                      isActive
                        ? 'bg-white text-blue-900 shadow-lg translate-x-2'
                        : 'text-blue-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-blue-300 group-hover:text-white'} transition-colors`}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Sign Out */}
        <div className="p-4" style={{ background: 'linear-gradient(0deg, #0d1457 0%, transparent 100%)' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-blue-300 hover:text-white transition-colors px-4 py-3 w-full text-sm font-bold uppercase tracking-wider hover:bg-white/10 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </nav>
    </>
  );
}

// Mobile Nav Wrapper Component for pages
export function MobileNavWrapper({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav
        onMobileToggle={() => setIsMobileOpen(!isMobileOpen)}
        isMobileOpen={isMobileOpen}
      />
      <main className="lg:ml-64 p-4 lg:p-8 pt-16 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
