// Custom country dropdown that shows flag images (native <select> can't render images).
"use client";

import { useEffect, useRef, useState } from "react";
import { CountryFlag, ChevronDownIcon } from "@/frontend/agentUi";

export default function CountrySelect({
  value,
  countries,
  onChange,
}: {
  value: string;
  countries: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const label = value === "All" ? "All Countries" : value;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white py-1.5 pl-3 pr-2 text-xs font-medium text-gray-700 outline-none hover:bg-gray-50"
      >
        {value !== "All" && <CountryFlag country={value} />}
        <span className="max-w-[150px] truncate">{label}</span>
        <ChevronDownIcon />
      </button>

      {open && (
        <ul className="absolute z-30 mt-1 max-h-72 w-60 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <li>
            <button
              type="button"
              onClick={() => { onChange("All"); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-gray-50 ${value === "All" ? "bg-gray-100 font-semibold" : ""}`}
            >
              All Countries
            </button>
          </li>
          {countries.map((c) => (
            <li key={c}>
              <button
                type="button"
                onClick={() => { onChange(c); setOpen(false); }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-gray-50 ${value === c ? "bg-gray-100 font-semibold" : ""}`}
              >
                <CountryFlag country={c} />
                <span className="truncate">{c}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
