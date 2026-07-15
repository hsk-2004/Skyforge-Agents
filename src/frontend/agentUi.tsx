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
  logo?: string | null; // company logo image URL
  createdAt?: string; // ISO timestamp of when the record was imported
}

// Company logo avatar: shows the logo image, falling back to initials when
// there is no logo or the image fails to load.
export function AgentLogo({ logo, company, size = 36 }: { logo?: string | null; company: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white text-xs font-semibold text-slate-400"
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={`${company} logo`}
          loading="lazy"
          className="h-full w-full object-contain"
          // Swap to initials if the remote image 404s
          onError={(e) => {
            const el = e.currentTarget;
            el.style.display = "none";
            if (el.parentElement) el.parentElement.textContent = company.slice(0, 2).toUpperCase();
          }}
        />
      ) : (
        company.slice(0, 2).toUpperCase()
      )}
    </div>
  );
}

// Map a country name to its flag emoji; falls back to a white flag if unknown
// Country name -> ISO 3166-1 alpha-2 code. Kept as text (e.g. "IN") so every
// country shows a consistent short form instead of a mix of flags / blanks.
const COUNTRY_CODES: { [key: string]: string } = {
  Afghanistan: "AF", Albania: "AL", Algeria: "DZ", Andorra: "AD", Angola: "AO",
  "Antigua and Barbuda": "AG", Argentina: "AR", Armenia: "AM", Australia: "AU",
  Austria: "AT", Azerbaijan: "AZ", Bahamas: "BS", Bahrain: "BH", Bangladesh: "BD",
  Barbados: "BB", Belarus: "BY", Belgium: "BE", Belize: "BZ", Benin: "BJ",
  Bhutan: "BT", Bolivia: "BO", "Bosnia and Herzegovina": "BA", Botswana: "BW",
  Brazil: "BR", Brunei: "BN", Bulgaria: "BG", "Burkina Faso": "BF", Burundi: "BI",
  Cambodia: "KH", Cameroon: "CM", Canada: "CA", "Cape Verde": "CV", Chad: "TD",
  Chile: "CL", China: "CN", Colombia: "CO", "Costa Rica": "CR", "Ivory Coast": "CI",
  "Cote d'Ivoire": "CI", Croatia: "HR", Cuba: "CU", Cyprus: "CY", "Czech Republic": "CZ",
  Czechia: "CZ", "Democratic Republic of the Congo": "CD", Denmark: "DK", Djibouti: "DJ",
  Dominica: "DM", "Dominican Republic": "DO", Ecuador: "EC", Egypt: "EG",
  "El Salvador": "SV", Estonia: "EE", Eswatini: "SZ", Ethiopia: "ET", Fiji: "FJ",
  Finland: "FI", France: "FR", Gabon: "GA", Gambia: "GM", Georgia: "GE",
  Germany: "DE", Ghana: "GH", Greece: "GR", Grenada: "GD", Guatemala: "GT",
  Guinea: "GN", Guyana: "GY", Haiti: "HT", Honduras: "HN", "Hong Kong": "HK",
  Hungary: "HU", Iceland: "IS", India: "IN", Indonesia: "ID", Iran: "IR", Iraq: "IQ",
  Ireland: "IE", Israel: "IL", Italy: "IT", Jamaica: "JM", Japan: "JP", Jordan: "JO",
  Kazakhstan: "KZ", Kenya: "KE", Kosovo: "XK", Kuwait: "KW", Kyrgyzstan: "KG",
  Laos: "LA", Latvia: "LV", Lebanon: "LB", Lesotho: "LS", Liberia: "LR", Libya: "LY",
  Liechtenstein: "LI", Lichtenstein: "LI", Lithuania: "LT", Luxembourg: "LU",
  Macau: "MO", Madagascar: "MG", "North Macedonia": "MK", Macedonia: "MK",
  Malawi: "MW", Malaysia: "MY", Maldives: "MV", Mali: "ML", Malta: "MT",
  Mauritania: "MR", Mauritius: "MU", Mexico: "MX", Moldova: "MD", Monaco: "MC",
  Mongolia: "MN", Montenegro: "ME", Morocco: "MA", Mozambique: "MZ", Myanmar: "MM",
  Namibia: "NA", Nepal: "NP", Netherlands: "NL", "New Zealand": "NZ", Nicaragua: "NI",
  Niger: "NE", Nigeria: "NG", "North Korea": "KP", Norway: "NO", Oman: "OM",
  Pakistan: "PK", Panama: "PA", "Papua New Guinea": "PG", Paraguay: "PY", Peru: "PE",
  Philippines: "PH", Poland: "PL", Portugal: "PT", Qatar: "QA", "Republic of the Congo": "CG",
  Congo: "CG", Romania: "RO", Russia: "RU", Rwanda: "RW", "Saudi Arabia": "SA",
  Senegal: "SN", Serbia: "RS", Seychelles: "SC", "Sierra Leone": "SL", Singapore: "SG",
  Slovakia: "SK", Slovenia: "SI", Somalia: "SO", "South Africa": "ZA", "South Korea": "KR",
  "South-Korea": "KR", Korea: "KR", "South Sudan": "SS", Spain: "ES", "Sri Lanka": "LK",
  Sudan: "SD", Suriname: "SR", Sweden: "SE", Switzerland: "CH", Syria: "SY", Taiwan: "TW",
  Tajikistan: "TJ", Tanzania: "TZ", Thailand: "TH", Togo: "TG", "Trinidad and Tobago": "TT",
  Tunisia: "TN", Turkey: "TR", "Türkiye": "TR", Turkmenistan: "TM", Uganda: "UG",
  Ukraine: "UA", UAE: "AE", "United Arab Emirates": "AE", UK: "GB", "United Kingdom": "GB",
  USA: "US", "United States": "US", "United States of America": "US", Uruguay: "UY",
  Uzbekistan: "UZ", Venezuela: "VE", Vietnam: "VN", Yemen: "YE", Zambia: "ZM", Zimbabwe: "ZW",
};

// Strict lookup: the real ISO code for a country, or null if unknown
export const getCountryCode = (countryName: string): string | null => {
  if (!countryName) return null;
  const code = COUNTRY_CODES[countryName];
  if (code) return code;
  const hit = Object.keys(COUNTRY_CODES).find((k) => k.toLowerCase() === countryName.toLowerCase());
  return hit ? COUNTRY_CODES[hit] : null;
};

// Return the country's short code (e.g. "IN") as text; used where an image can't
// be rendered (e.g. <option> elements). Falls back to the first two letters.
export const getFlagEmoji = (countryName: string) => {
  if (!countryName) return "";
  return getCountryCode(countryName) || countryName.slice(0, 2).toUpperCase();
};

// Flag image for a country (from flagcdn.com). Falls back to the text code when unknown.
export function CountryFlag({ country, className = "" }: { country: string; className?: string }) {
  const code = getCountryCode(country);
  if (!code) {
    return (
      <span className={`text-[10px] font-semibold text-gray-400 ${className}`}>
        {country.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  const cc = code.toLowerCase();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/24x18/${cc}.png`}
      srcSet={`https://flagcdn.com/48x36/${cc}.png 2x`}
      width={20}
      height={15}
      alt={country}
      title={country}
      loading="lazy"
      className={`inline-block h-[15px] w-[20px] shrink-0 rounded-[2px] object-cover ${className}`}
    />
  );
}

// Render a space/comma-separated field (e.g. "Air Road Sea") as stacked chips
export function TagChips({ value }: { value?: string | null }) {
  const tokens = (value || "").split(/[\s,]+/).map((t) => t.trim()).filter(Boolean);
  if (tokens.length === 0) return <span className="text-xs text-gray-300">—</span>;
  return (
    <div className="flex w-fit flex-col gap-1">
      {tokens.map((t, i) => (
        <span
          key={i}
          className="inline-flex w-fit items-center rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs text-slate-700"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

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
