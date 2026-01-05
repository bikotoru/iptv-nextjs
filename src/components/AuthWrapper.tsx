"use client";

import type { ReactNode } from "react";
import { Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
import { LoginForm } from "./LoginForm";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface AuthWrapperProps {
  children: ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { isConfigured, clearConfiguration, isLoading } = useAuth();
  const t = useTranslations("settings");

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    return <LoginForm />;
  }

  return (
    <div className="relative">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <LanguageSwitcher />

        <button
          onClick={clearConfiguration}
          className="flex items-center gap-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 px-3 py-2 text-sm font-medium transition-colors backdrop-blur-sm border border-blue-500/20"
          title={t("changeSettings")}
        >
          <Settings className="h-4 w-4" />
          {t("settingsButton")}
        </button>

        <button
          onClick={clearConfiguration}
          className="flex items-center gap-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 px-3 py-2 text-sm font-medium transition-colors backdrop-blur-sm border border-red-500/20"
          title={t("clearConfig")}
        >
          <LogOut className="h-4 w-4" />
          {t("clearButton")}
        </button>
      </div>

      {children}
    </div>
  );
}
