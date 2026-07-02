// Sidebar: app-wide navigation rail.
// Renders as a bottom bar on mobile and a vertical left rail on desktop (md+).
import Link from "next/link";

// Navigation entries; `active` marks the currently highlighted item.
const navItems = [
  { label: "Grid", icon: GridIcon, active: true },
  { label: "Notifications", icon: BellIcon },
  { label: "Bookmarks", icon: BookmarkIcon },
  { label: "Chat", icon: ChatIcon },
  { label: "Mail", icon: MailIcon },
  { label: "Help", icon: HelpIcon },
];

export default function Sidebar() {
  return (
    <aside className="fixed bottom-0 left-0 z-20 flex w-full flex-row items-center gap-2 border-t border-gray-200 bg-white px-3 py-2 md:sticky md:top-0 md:h-screen md:w-20 md:flex-col md:gap-6 md:border-r md:border-t-0 md:px-0 md:py-5">
      {/* App logo — links back to the home dashboard */}
      <Link href="/" className="flex flex-col items-center gap-0.5">
        <LogoIcon />
        <span className="hidden text-[10px] font-medium text-gray-400 md:block">Beta</span>
      </Link>

      {/* User avatar button (placeholder emoji for now) */}
      <button className="h-9 w-9 overflow-hidden rounded-full border-2 border-white ring-2 ring-indigo-500 md:mb-2 md:h-11 md:w-11">
        <div className="flex h-full w-full items-center justify-center bg-gray-800 text-xs text-white">
          🧑
        </div>
      </button>

      {/* Navigation icon buttons, built from the navItems list above */}
      <nav className="flex flex-1 flex-row items-center justify-around gap-2 md:flex-col md:justify-start md:gap-5">
        {navItems.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            aria-label={label}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              active
                ? "text-indigo-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Icon active={active} />
          </button>
        ))}
      </nav>
    </aside>
  );
}

// ---- Inline SVG icon components used by the sidebar ----

// Skyforge logo mark (indigo bolt + orange dot)
function LogoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path
        d="M6 22L14 4L22 10L14 26L6 22Z"
        fill="#4F46E5"
      />
      <circle cx="22" cy="6" r="3" fill="#F97316" />
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

// Bookmarks / saved items icon
function BookmarkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
