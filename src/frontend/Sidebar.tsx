// Sidebar: app-wide navigation rail.
// Renders as a bottom bar on mobile and a vertical left rail on desktop (md+).
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

// Navigation entries; `href` is set only for routes that exist today —
// the rest render as disabled "coming soon" placeholders.
const navItems: { label: string; icon: React.ComponentType<{ active?: boolean }>; href?: string }[] = [
  { label: "Dashboard", icon: GridIcon, href: "/" },
  { label: "Agents", icon: BookmarkIcon, href: "/results" },
  { label: "Notifications", icon: BellIcon },
  { label: "Chat", icon: ChatIcon },
  { label: "Mail", icon: MailIcon },
  { label: "Help", icon: HelpIcon },
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
          const active = href !== undefined && pathname === href;
          // Real route → link; unbuilt feature → visibly disabled button
          return href ? (
            <Link
              key={label}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              title={label}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors md:h-10 md:w-10 ${
                active ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon active={active} />
            </Link>
          ) : (
            <button
              key={label}
              type="button"
              disabled
              aria-label={`${label} (coming soon)`}
              title={`${label} — coming soon`}
              className="hidden h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg text-gray-300 sm:flex"
            >
              <Icon />
            </button>
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

// Notifications bell icon
function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
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

// Chat / messaging icon
function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

// Mail / inbox icon
function MailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 6l10 7 10-7" />
    </svg>
  );
}

// Help / support icon (question mark in a circle)
function HelpIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.5 9a2.5 2.5 0 015 .5c0 1.5-2.5 2-2.5 3.5" />
      <path d="M12 17h.01" />
    </svg>
  );
}
