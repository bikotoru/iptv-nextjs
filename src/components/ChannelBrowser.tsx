"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { AlertCircle, RefreshCw, Tv } from "lucide-react";
import { VideoPlayerArea } from "./VideoPlayerArea";
import { CategoriesSidebar } from "./CategoriesSidebar";
import { ChannelListPanel } from "./ChannelListPanel";
import { MobileControls } from "./MobileControls";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
import { parseM3U8Content, m3u8ToCategories, fetchAndParseM3U8 } from "@/lib/m3u8-parser";
import type { ChannelCategory, ChannelStream } from "@/types/xtream";

const CACHE_KEY = "react-iptv-categories-cache";
const CACHE_DURATION = 5 * 60 * 1000;

interface CacheData {
  categories: ChannelCategory[];
  timestamp: number;
  credentialsHash: string;
}

export function ChannelBrowser() {
  const { credentials, activeConnection } = useAuth();
  const t = useTranslations("browser");
  const [categories, setCategories] = useState<ChannelCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderedCategories = useMemo(
    () =>
      [...categories].sort((a, b) =>
        a.name.localeCompare(b.name, "es", { sensitivity: "base" })
      ),
    [categories]
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    orderedCategories[0]?.id ?? ""
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showChannelFavorites, setShowChannelFavorites] = useState(false);
  const [selectedStream, setSelectedStream] = useState<ChannelStream | null>(
    null
  );
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChannelListOpen, setIsChannelListOpen] = useState(false);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [isChannelPanelCollapsed, setIsChannelPanelCollapsed] = useState(false);

  const connectionHash = useMemo(() => {
    if (!activeConnection) return "";
    return btoa(JSON.stringify(activeConnection.credentials)).slice(0, 16);
  }, [activeConnection]);

  // Load categories for M3U8 connection
  const loadM3U8Categories = useCallback(async () => {
    if (!activeConnection || activeConnection.credentials.type !== "m3u8") {
      return null;
    }

    const creds = activeConnection.credentials;

    try {
      let entries;

      if (creds.content) {
        // Parse from stored content
        entries = parseM3U8Content(creds.content);
      } else if (creds.url) {
        // Fetch and parse from URL
        entries = await fetchAndParseM3U8(creds.url, {
          userAgent: creds.userAgent,
          referer: creds.streamReferer,
        });
      } else {
        throw new Error(t("errorNoM3U8Source"));
      }

      if (entries.length === 0) {
        throw new Error(t("errorEmptyM3U8"));
      }

      return m3u8ToCategories(entries, t("defaultCategory"));
    } catch (err) {
      throw err;
    }
  }, [activeConnection, t]);

  // Load categories for Xtream connection
  const loadXtreamCategories = useCallback(async () => {
    if (!credentials) return null;

    const response = await fetch(
      `/api/xtream?credentials=${encodeURIComponent(
        JSON.stringify(credentials)
      )}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || t("apiRequestFailed"));
    }

    const data = await response.json();
    return data.categories || [];
  }, [credentials, t]);

  const loadCategories = useCallback(
    async (forceRefresh = false) => {
      if (!activeConnection) return;

      setIsLoading(true);
      setError(null);

      try {
        // Check cache first (unless force refresh)
        if (!forceRefresh) {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            const cacheData: CacheData = JSON.parse(cached);
            const isExpired = Date.now() - cacheData.timestamp > CACHE_DURATION;
            const isSameCredentials = cacheData.credentialsHash === connectionHash;

            if (
              !isExpired &&
              isSameCredentials &&
              cacheData.categories.length > 0
            ) {
              setCategories(cacheData.categories);
              if (cacheData.categories.length > 0 && !selectedCategoryId) {
                setSelectedCategoryId(cacheData.categories[0].id);
              }
              setIsLoading(false);
              return;
            }
          }
        }

        // Load based on connection type
        let newCategories: ChannelCategory[] | null = null;

        if (activeConnection.credentials.type === "m3u8") {
          newCategories = await loadM3U8Categories();
        } else {
          newCategories = await loadXtreamCategories();
        }

        if (!newCategories) {
          throw new Error(t("errorLoadingCategories"));
        }

        // Cache the results
        const cacheData: CacheData = {
          categories: newCategories,
          timestamp: Date.now(),
          credentialsHash: connectionHash,
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        setCategories(newCategories);

        if (newCategories.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(newCategories[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t("errorLoadingCategories")
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeConnection, selectedCategoryId, connectionHash, loadM3U8Categories, loadXtreamCategories, t]
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (activeConnection) {
      localStorage.removeItem(CACHE_KEY);
    }
  }, [activeConnection]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      if (next) setIsChannelListOpen(false);
      return next;
    });
  }, []);

  const toggleChannelList = useCallback(() => {
    setIsChannelListOpen((prev) => {
      const next = !prev;
      if (next) setIsSidebarOpen(false);
      return next;
    });
  }, []);

  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) return orderedCategories[0];
    return (
      orderedCategories.find(
        (category) => category.id === selectedCategoryId
      ) ?? orderedCategories[0]
    );
  }, [orderedCategories, selectedCategoryId]);

  const activeStreamId = selectedStream?.id ?? null;
  const totals = useMemo(
    () => ({
      totalStreams: categories.reduce(
        (acc, category) => acc + category.streams.length,
        0
      ),
      totalCategories: categories.length,
    }),
    [categories]
  );

  const handlePlayStream = useCallback((stream: ChannelStream) => {
    setSelectedStream(stream);
    setIsPlayerOpen(true);
    setIsChannelListOpen(false);
  }, []);

  const handleClosePlayer = useCallback(() => {
    setIsPlayerOpen(false);
    setSelectedStream(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="text-center max-w-md mx-4">
          <div className="rounded-full bg-red-500/20 p-6 mb-6 mx-auto w-fit">
            <AlertCircle className="h-12 w-12 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-4">
            {t("loadFailed")}
          </h2>
          <p className="text-slate-300 mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => loadCategories(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/80 transition-colors mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="text-center max-w-md mx-4">
          <div className="rounded-full bg-slate-500/20 p-6 mb-6 mx-auto w-fit">
            <Tv className="h-12 w-12 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-4">
            {t("noCategories")}
          </h2>
          <p className="text-slate-300 mb-6 leading-relaxed">
            {t("noCategoriesDesc")}
          </p>
          <button
            onClick={() => loadCategories(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/80 transition-colors mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            {t("refresh")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 lg:flex-row">
      <MobileControls
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        onToggleChannelList={toggleChannelList}
      />

      {/* Sidebar Overlay (Mobile) */}
      {(isSidebarOpen || isChannelListOpen) && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => {
            setIsSidebarOpen(false);
            setIsChannelListOpen(false);
          }}
        />
      )}

      <CategoriesSidebar
        categories={orderedCategories}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={(categoryId) => {
          setSelectedCategoryId(categoryId);
          setSearchTerm("");
          setIsSidebarOpen(false);
        }}
        isSidebarOpen={isSidebarOpen}
        isMenuCollapsed={isMenuCollapsed}
        onToggleMenuCollapsed={() => setIsMenuCollapsed(!isMenuCollapsed)}
        totals={totals}
      />

      <ChannelListPanel
        selectedCategory={selectedCategory}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showChannelFavorites={showChannelFavorites}
        onToggleChannelFavorites={() =>
          setShowChannelFavorites(!showChannelFavorites)
        }
        isChannelPanelCollapsed={isChannelPanelCollapsed}
        onToggleChannelPanelCollapsed={() =>
          setIsChannelPanelCollapsed(!isChannelPanelCollapsed)
        }
        onPlayStream={handlePlayStream}
        activeStreamId={activeStreamId}
      />

      <VideoPlayerArea
        selectedStream={selectedStream}
        isPlayerOpen={isPlayerOpen}
        onClosePlayer={handleClosePlayer}
      />
    </div>
  );
}
