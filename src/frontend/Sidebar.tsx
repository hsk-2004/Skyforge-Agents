// Sidebar: app-wide navigation rail.
// Renders as a bottom bar on mobile and a vertical left rail on desktop (md+).
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

// Navigation entries — only real routes, no placeholder items
const navItems: { label: string; icon: React.ComponentType<{ active?: boolean }>; href: string }[] = [
  { label: "Dashboard", icon: GridIcon, href: "/" },
  { label: "Agents", icon: BookmarkIcon, href: "/results" },
  { label: "Shortlist", icon: StarIcon, href: "/shortlist" },
];

export default function Sidebar({ userName }: { userName?: string | null }) {
  // Hide the sidebar on auth pages (login/register have their own full-screen layout)
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  if (pathname === "/login" || pathname === "/register") return null;

  // First letter of the signed-in user's name for the avatar badge
  const initial = userName?.trim().charAt(0).toUpperCase() || "S";

  return (
    <aside className="fixed bottom-0 left-0 z-20 flex w-full flex-row items-center gap-1 border-t border-gray-200 bg-white px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] sm:gap-2 sm:px-3 md:sticky md:top-0 md:h-screen md:w-20 md:flex-col md:gap-6 md:border-r md:border-t-0 md:px-0 md:py-5">
      {/* App logo — links back to the home dashboard */}
      <Link href="/" aria-label="Skyforge home" className="flex shrink-0 flex-col items-center gap-0.5">
        <LogoIcon />
        <span className="hidden text-[10px] font-medium text-gray-400 md:block">Beta</span>
      </Link>

      {/* User avatar showing the signed-in user's initial */}
      <div
        aria-label={userName ? `Signed in as ${userName}` : "User avatar"}
        title={userName || undefined}
        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-800 text-sm font-semibold text-white ring-2 ring-indigo-500 md:mb-2 md:h-11 md:w-11"
      >
        {initial}
      </div>

      {/* Navigation icon buttons, built from the navItems list above */}
      <nav aria-label="Main navigation" className="flex min-w-0 flex-1 flex-row items-center justify-around gap-1 md:flex-col md:justify-start md:gap-4">
        {navItems.map(({ label, icon: Icon, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              title={label}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                active ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon active={active} />
            </Link>
          );
        })}
      </nav>

      {/* Sign out — ends the session and returns to the login page */}
      <button
        type="button"
        aria-label="Sign out"
        title="Sign out"
        disabled={signingOut}
        onClick={() => {
          setSigningOut(true);
          signOut({ callbackUrl: "/login" });
        }}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-red-500 disabled:opacity-50"
      >
        <SignOutIcon />
      </button>
    </aside>
  );
}

// Sign out icon (door with arrow)
function SignOutIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ---- Inline SVG icon components used by the sidebar ----

// Skyforge logo mark: "S" lettermark tile matching the favicon
function LogoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
      <defs>
        {/* Same indigo gradient as the favicon */}
        <linearGradient id="sidebar-logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>
      </defs>
      {/* Rounded tile background */}
      <rect width="64" height="64" rx="14" fill="url(#sidebar-logo-bg)" />
      {/* Bold "S" curve */}
      <path
        d="M44 20c-3-4-10-6-16-4c-6 2-8 8-4 12c3 3 9 3 14 5c6 2 8 8 4 12c-4 4-13 4-18-1"
        fill="none"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* Orange forge-spark accent dot */}
      <circle cx="49" cy="13" r="6" fill="#F97316" />
    </svg>
  );
}

// Dashboard grid icon; fills indigo when the item is active
function GridIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="8" height="8" rx="1.5" fill={active ? "#4F46E5" : "currentColor"} />
      <rect x="13" y="3" width="8" height="8" rx="1.5" fill={active ? "#4F46E5" : "currentColor"} />
      <rect x="3" y="13" width="8" height="8" rx="1.5" fill={active ? "#4F46E5" : "currentColor"} />
      <rect x="13" y="13" width="8" height="8" rx="1.5" fill={active ? "#4F46E5" : "currentColor"} />
    </svg>
  );
}

// Shortlist star icon; strokes indigo when active
function StarIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#4F46E5" : "none"} stroke={active ? "#4F46E5" : "currentColor"} strokeWidth="1.8">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

// Agents list / saved items icon; strokes indigo when active
function BookmarkIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#4F46E5" : "currentColor"} strokeWidth="1.8">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  );
}
