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
}

export const getFlagEmoji = (countryName: string) => {
  const code: { [key: string]: string } = {
    Argentina: "🇦🇷",
    Australia: "🇦🇺",
    Brazil: "🇧🇷",
    Canada: "🇨🇦",
    China: "🇨🇳",
    Colombia: "🇨🇴",
    "Czech Republic": "🇨🇿",
    France: "🇫🇷",
    Germany: "🇩🇪",
    India: "🇮🇳",
    Italy: "🇮🇹",
    Malaysia: "🇲🇾",
    Mexico: "🇲🇽",
    Poland: "🇵🇱",
    "Saudi Arabia": "🇸🇦",
    "South Africa": "🇿🇦",
    "South Korea": "🇰🇷",
    "South-Korea": "🇰🇷",
    Spain: "🇪🇸",
    Turkey: "🇹🇷",
    Türkiye: "🇹🇷",
    "United Arab Emirates": "🇦🇪",
    "United Kingdom": "🇬🇧",
    "United States of America": "🇺🇸",
    Vietnam: "🇻🇳",
  };
  return code[countryName] || "🏳️";
};

// Deterministically generate beautiful mock data for columns empty in DB
export const getDeterministicMockData = (id: string, name: string) => {
  const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const mockContactsList = [
    ["Gabriel Ferrari", "Franyer Mald..."],
    ["Mr. Alex Gia..."],
    ["CARLOS BIDAB...", "Manuela Pala..."],
    ["Claudio Spal..."],
    ["Alonso Logis..."],
    ["GASTON ARIEL...", "FRANCO PARED"],
    ["ARGENTINA CA...", "Mr Hernan Ca..."],
    ["CEO / Presid...", "Director - M...", "Overseas Man..."],
    ["Elena Rostova", "Sergei Ivanov"],
    ["Koji Tanaka", "Yuki Sato"],
  ];

  const mockNetworksList = [
    ["IAN"],
    ["JC Trans"],
    ["MGLN"],
    ["PPL"],
    ["JC Trans", "Connecta"],
    ["MarcoPolo"],
    ["IAN", "PPL"],
    ["MGLN", "JC Trans"],
    ["Connecta"],
    ["MarcoPolo", "IAN"],
  ];

  const ratingValue = 3.8 + (hash % 12) / 10;
  const contacts = mockContactsList[hash % mockContactsList.length];
  const networks = mockNetworksList[hash % mockNetworksList.length];
  const rating = hash % 3 === 0 ? null : parseFloat(ratingValue.toFixed(1)); // Some blank ratings like screenshot

  return { contacts, networks, rating };
};

export const getNetworkBadgeStyles = (network: string) => {
  const styles: { [key: string]: string } = {
    "JC Trans": "bg-orange-50 text-orange-700 border border-orange-200",
    MGLN: "bg-gray-100 text-gray-700 border border-gray-300",
    IAN: "bg-blue-50 text-blue-700 border border-blue-200",
    PPL: "bg-purple-50 text-purple-700 border border-purple-200",
    Connecta: "bg-green-50 text-green-700 border border-green-200",
    MarcoPolo: "bg-amber-50 text-amber-700 border border-amber-200",
  };
  return styles[network] || "bg-slate-100 text-slate-700 border border-slate-200";
};

// Icon Components
export function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

export function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

export function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

export function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      onMouseDown={onMouseDown}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-0 right-0 h-full w-2 cursor-col-resize select-none touch-none hover:bg-indigo-300/50 active:bg-indigo-400/60"
    />
  );
}

export function UpDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-gray-400">
      <path d="M8 7l4-4 4 4" />
      <path d="M8 17l4 4 4-4" />
      <path d="M12 3v18" />
    </svg>
  );
}

export function ContactDotIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-indigo-400">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

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
