// Shared UI helpers for agent pages: the Agent type, flag/badge/mock-data
// utilities, and the small inline SVG icon components.

// Shape of an agent record as returned by /api/agents (mirrors the Prisma model)
export interface Agent {
  id: string;
  company: string;
  financialStatus: string | null;
  fullAddress: string | null;
  city: string | null;
  country: string;
  rating: number | null;
  coverage: string | null;
  operation: string | null;
  transportMode: string | null;
  services: string | null;
  contacts: string | null;
  segments: string | null;
  networks: string | null;
  createdAt?: string; // ISO timestamp of when the record was imported
}

// Map a country name to its flag emoji; falls back to a white flag if unknown
export const getFlagEmoji = (countryName: string) => {
  // Added flag emojis for countries imported from AON.xlsx (Albania, Austria, Bangladesh, etc.)
  const code: { [key: string]: string } = {
    Albania: "🇦🇱",
    Argentina: "🇦🇷",
    Australia: "🇦🇺",
    Austria: "🇦🇹",
    Bangladesh: "🇧🇩",
    Belgium: "🇧🇪",
    Brazil: "🇧🇷",
    Bulgaria: "🇧🇬",
    Cambodia: "🇰🇭",
    Canada: "🇨🇦",
    Chile: "🇨🇱",
    China: "🇨🇳",
    Colombia: "🇨🇴",
    Croatia: "🇭🇷",
    Cyprus: "🇨🇾",
    "Czech Republic": "🇨🇿",
    Djibouti: "🇩🇯",
    "Dominican Republic": "🇩🇴",
    Egypt: "🇪🇬",
    "El Salvador": "🇸🇻",
    Ethiopia: "🇪🇹",
    Finland: "🇫🇮",
    France: "🇫🇷",
    Germany: "🇩🇪",
    Ghana: "🇬🇭",
    Greece: "🇬🇷",
    Guatemala: "🇬🇹",
    Haiti: "🇭🇹",
    "Hong Kong": "🇭🇰",
    India: "🇮🇳",
    Indonesia: "🇮🇩",
    Iran: "🇮🇷",
    Iraq: "🇮🇶",
    Israel: "🇮🇱",
    Italy: "🇮🇹",
    Japan: "🇯🇵",
    Korea: "🇰🇷",
    "South Korea": "🇰🇷",
    "South-Korea": "🇰🇷",
    Kosovo: "🇽🇰",
    Lebanon: "🇱🇧",
    Lichtenstein: "🇱🇮",
    Macedonia: "🇲🇰",
    Malaysia: "🇲🇾",
    Mauritius: "🇲🇺",
    Mexico: "🇲🇽",
    Morocco: "🇲🇦",
    Myanmar: "🇲🇲",
    Nepal: "🇳🇵",
    Netherlands: "🇳🇱",
    "New Zealand": "🇳🇿",
    Nigeria: "🇳🇬",
    Pakistan: "🇵🇰",
    Peru: "🇵🇪",
    Philippines: "🇵🇭",
    Poland: "🇵🇱",
    Portugal: "🇵🇹",
    Romania: "🇷🇴",
    "Saudi Arabia": "🇸🇦",
    Senegal: "🇸🇳",
    Singapore: "🇸🇬",
    Slovenia: "🇸🇮",
    "South Africa": "🇿🇦",
    Spain: "🇪🇸",
    "Sri Lanka": "🇱🇰",
    Sweden: "🇸🇪",
    Switzerland: "🇨🇭",
    Syria: "🇸🇾",
    Taiwan: "🇹🇼",
    Thailand: "🇹🇭",
    Tunisia: "🇹🇳",
    Turkey: "🇹🇷",
    Türkiye: "🇹🇷",
    UAE: "🇦🇪",
    "United Arab Emirates": "🇦🇪",
    UK: "🇬🇧",
    "United Kingdom": "🇬🇧",
    USA: "🇺🇸",
    "United States of America": "🇺🇸",
    Uganda: "🇺🇬",
    Uruguay: "🇺🇾",
    Vietnam: "🇻🇳",
  };
  return code[countryName] || "🏳️";
};

// Return Tailwind classes for a network badge, giving each network its own color
export const getNetworkBadgeStyles = (network: string) => {
  const styles: { [key: string]: string } = {
    "JC Trans": "bg-orange-50 text-orange-700 border border-orange-200",
    MGLN: "bg-gray-100 text-gray-700 border border-gray-300",
    IAN: "bg-blue-50 text-blue-700 border border-blue-200",
    PPL: "bg-purple-50 text-purple-700 border border-purple-200",
    Connecta: "bg-green-50 text-green-700 border border-green-200",
    MarcoPolo: "bg-amber-50 text-amber-700 border border-amber-200",
    // Custom rose colored badge style added for AerOceaNetwork (AON) agents
    AON: "bg-rose-50 text-rose-700 border border-rose-200",
  };
  return styles[network] || "bg-slate-100 text-slate-700 border border-slate-200";
};

// ---- Inline SVG icon components used across the agent pages ----

// Magnifying glass icon for search inputs
export function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

// Small down arrow used on dropdown triggers
export function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// Right arrow used on clickable table rows
export function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// Back arrow for the "return to dashboard" button
export function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

// Green check mark used in the "All sources loaded" badge
export function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// Amber star for ratings
export function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

// Person silhouette used in the activity feed
export function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

// Invisible drag strip on the right edge of a table header cell.
// The parent supplies the onMouseDown handler that starts the column resize;
// clicks are stopped so resizing doesn't also trigger the header's sort.
export function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      onMouseDown={onMouseDown}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-0 right-0 h-full w-2 cursor-col-resize select-none touch-none hover:bg-indigo-300/50 active:bg-indigo-400/60"
    />
  );
}

// Vertical up/down arrows shown next to office locations
export function UpDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-gray-400">
      <path d="M8 7l4-4 4 4" />
      <path d="M8 17l4 4 4-4" />
      <path d="M12 3v18" />
    </svg>
  );
}

// Small dot bullet shown before each contact chip
export function ContactDotIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-indigo-400">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

// Sort indicator for table headers: gray double arrow when inactive,
// a single indigo arrow (up = asc, down = desc) when the column is active.
export function SortIcon({ active, order }: { active: boolean; order: "asc" | "desc" }) {
  if (!active) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300">
        <path d="M8 9l4-4 4 4" />
        <path d="M16 15l-4 4-4-4" />
      </svg>
    );
  }
  return order === "asc" ? (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-600">
      <path d="M8 9l4-4 4 4" />
    </svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-600">
      <path d="M16 15l-4 4-4-4" />
    </svg>
  );
}
