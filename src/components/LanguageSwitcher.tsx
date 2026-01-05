"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { useLanguage, locales, localeNames, localeFlags, type Locale } from "@/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors backdrop-blur-sm border border-white/10"
        title="Change language"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{localeFlags[locale]} {localeNames[locale]}</span>
        <span className="sm:hidden">{localeFlags[locale]}</span>
        <ChevronDown className={clsx("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 rounded-lg bg-slate-800 border border-white/10 shadow-xl z-50 overflow-hidden">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleSelect(loc)}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                locale === loc
                  ? "bg-primary/20 text-primary"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="text-base">{localeFlags[loc]}</span>
              <span>{localeNames[loc]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
