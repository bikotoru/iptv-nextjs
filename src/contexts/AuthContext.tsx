"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type {
  IPTVConnection,
  ConnectionCredentials,
  XtreamCredentials,
  M3U8Connection,
} from "@/types/xtream";

// Legacy interface for backwards compatibility
interface IPTVCredentials {
  apiBase: string;
  username: string;
  password: string;
  sessionCookie?: string;
  userAgent?: string;
  streamReferer?: string;
}

interface AuthContextType {
  // Legacy single connection support (for backwards compatibility)
  isConfigured: boolean;
  credentials: IPTVCredentials | null;
  configureIPTV: (credentials: IPTVCredentials) => void;
  clearConfiguration: () => void;
  isLoading: boolean;

  // Multi-connection support
  connections: IPTVConnection[];
  activeConnection: IPTVConnection | null;
  activeConnectionId: string | null;
  addConnection: (name: string, credentials: ConnectionCredentials) => IPTVConnection;
  updateConnection: (id: string, name: string, credentials: ConnectionCredentials) => void;
  removeConnection: (id: string) => void;
  setActiveConnection: (id: string | null) => void;
  getConnection: (id: string) => IPTVConnection | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const CONNECTIONS_STORAGE_KEY = "react-iptv-connections";
const ACTIVE_CONNECTION_KEY = "react-iptv-active-connection";
// Legacy key for migration
const LEGACY_STORAGE_KEY = "react-iptv-credentials";

function generateConnectionId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Convert legacy credentials to new format
function legacyToXtreamCredentials(legacy: IPTVCredentials): XtreamCredentials {
  return {
    type: "xtream",
    apiBase: legacy.apiBase,
    username: legacy.username,
    password: legacy.password,
    sessionCookie: legacy.sessionCookie,
    userAgent: legacy.userAgent,
    streamReferer: legacy.streamReferer,
  };
}

// Convert new format to legacy for backwards compatibility
function connectionToLegacyCredentials(connection: IPTVConnection | null): IPTVCredentials | null {
  if (!connection) return null;

  const creds = connection.credentials;
  if (creds.type === "xtream") {
    return {
      apiBase: creds.apiBase,
      username: creds.username,
      password: creds.password,
      sessionCookie: creds.sessionCookie,
      userAgent: creds.userAgent,
      streamReferer: creds.streamReferer,
    };
  }

  // For M3U8, return a pseudo-credentials object
  if (creds.type === "m3u8") {
    return {
      apiBase: creds.url || "",
      username: "",
      password: "",
      userAgent: creds.userAgent,
      streamReferer: creds.streamReferer,
    };
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [connections, setConnections] = useState<IPTVConnection[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load connections from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    try {
      // Try to load new format first
      const storedConnections = localStorage.getItem(CONNECTIONS_STORAGE_KEY);
      const storedActiveId = localStorage.getItem(ACTIVE_CONNECTION_KEY);

      if (storedConnections) {
        const parsedConnections: IPTVConnection[] = JSON.parse(storedConnections);
        setConnections(parsedConnections);

        if (storedActiveId && parsedConnections.some(c => c.id === storedActiveId)) {
          setActiveConnectionId(storedActiveId);
        } else if (parsedConnections.length > 0) {
          setActiveConnectionId(parsedConnections[0].id);
        }
      } else {
        // Check for legacy format and migrate
        const legacyCredentials = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacyCredentials) {
          const legacy: IPTVCredentials = JSON.parse(legacyCredentials);
          const migratedConnection: IPTVConnection = {
            id: generateConnectionId(),
            name: "IPTV Principal",
            credentials: legacyToXtreamCredentials(legacy),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          setConnections([migratedConnection]);
          setActiveConnectionId(migratedConnection.id);

          // Save in new format
          localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify([migratedConnection]));
          localStorage.setItem(ACTIVE_CONNECTION_KEY, migratedConnection.id);

          // Remove legacy storage
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
      }
    } catch {
      // Silent error handling
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save connections to localStorage whenever they change
  const saveConnections = useCallback((newConnections: IPTVConnection[]) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(newConnections));
      } catch {
        // Silent error handling
      }
    }
  }, []);

  // Save active connection ID
  const saveActiveConnectionId = useCallback((id: string | null) => {
    if (typeof window !== "undefined") {
      try {
        if (id) {
          localStorage.setItem(ACTIVE_CONNECTION_KEY, id);
        } else {
          localStorage.removeItem(ACTIVE_CONNECTION_KEY);
        }
      } catch {
        // Silent error handling
      }
    }
  }, []);

  const addConnection = useCallback((name: string, credentials: ConnectionCredentials): IPTVConnection => {
    const newConnection: IPTVConnection = {
      id: generateConnectionId(),
      name,
      credentials,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setConnections(prev => {
      const updated = [...prev, newConnection];
      saveConnections(updated);
      return updated;
    });

    // If this is the first connection, make it active
    setActiveConnectionId(prev => {
      if (!prev) {
        saveActiveConnectionId(newConnection.id);
        return newConnection.id;
      }
      return prev;
    });

    return newConnection;
  }, [saveConnections, saveActiveConnectionId]);

  const updateConnection = useCallback((id: string, name: string, credentials: ConnectionCredentials) => {
    setConnections(prev => {
      const updated = prev.map(conn =>
        conn.id === id
          ? { ...conn, name, credentials, updatedAt: Date.now() }
          : conn
      );
      saveConnections(updated);
      return updated;
    });
  }, [saveConnections]);

  const removeConnection = useCallback((id: string) => {
    setConnections(prev => {
      const updated = prev.filter(conn => conn.id !== id);
      saveConnections(updated);

      // If we removed the active connection, switch to another one
      if (activeConnectionId === id) {
        const newActiveId = updated.length > 0 ? updated[0].id : null;
        setActiveConnectionId(newActiveId);
        saveActiveConnectionId(newActiveId);
      }

      // Clear cache when removing connection
      if (typeof window !== "undefined") {
        localStorage.removeItem("react-iptv-categories-cache");
      }

      return updated;
    });
  }, [activeConnectionId, saveConnections, saveActiveConnectionId]);

  const setActiveConnection = useCallback((id: string | null) => {
    setActiveConnectionId(id);
    saveActiveConnectionId(id);

    // Clear cache when switching connections
    if (typeof window !== "undefined") {
      localStorage.removeItem("react-iptv-categories-cache");
    }
  }, [saveActiveConnectionId]);

  const getConnection = useCallback((id: string): IPTVConnection | undefined => {
    return connections.find(conn => conn.id === id);
  }, [connections]);

  // Computed values
  const activeConnection = activeConnectionId
    ? connections.find(c => c.id === activeConnectionId) ?? null
    : null;

  const isConfigured = connections.length > 0 && activeConnection !== null;
  const credentials = connectionToLegacyCredentials(activeConnection);

  // Legacy method for backwards compatibility
  const configureIPTV = useCallback((legacyCredentials: IPTVCredentials) => {
    const xtreamCredentials = legacyToXtreamCredentials(legacyCredentials);

    if (connections.length === 0) {
      const newConn = addConnection("IPTV Principal", xtreamCredentials);
      setActiveConnection(newConn.id);
    } else if (activeConnection) {
      updateConnection(activeConnection.id, activeConnection.name, xtreamCredentials);
    }
  }, [connections.length, activeConnection, addConnection, setActiveConnection, updateConnection]);

  const clearConfiguration = useCallback(() => {
    setConnections([]);
    setActiveConnectionId(null);

    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(CONNECTIONS_STORAGE_KEY);
        localStorage.removeItem(ACTIVE_CONNECTION_KEY);
        localStorage.removeItem("react-iptv-categories-cache");
      } catch {
        // Silent error handling
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        // Legacy support
        isConfigured,
        credentials,
        configureIPTV,
        clearConfiguration,
        isLoading,

        // Multi-connection support
        connections,
        activeConnection,
        activeConnectionId,
        addConnection,
        updateConnection,
        removeConnection,
        setActiveConnection,
        getConnection,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export type { IPTVCredentials };
