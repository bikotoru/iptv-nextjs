"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Server,
  FileText,
  Radio,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
import type { IPTVConnection } from "@/types/xtream";

interface ConnectionManagerProps {
  onAddNew: () => void;
  onEdit: (connection: IPTVConnection) => void;
}

export function ConnectionManager({ onAddNew, onEdit }: ConnectionManagerProps) {
  const {
    connections,
    activeConnection,
    setActiveConnection,
    removeConnection,
  } = useAuth();
  const t = useTranslations("connections");
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      removeConnection(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      // Auto-cancel after 3 seconds
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const getConnectionIcon = (connection: IPTVConnection) => {
    return connection.credentials.type === "xtream" ? (
      <Server className="h-4 w-4" />
    ) : (
      <FileText className="h-4 w-4" />
    );
  };

  const getConnectionTypeLabel = (connection: IPTVConnection) => {
    return connection.credentials.type === "xtream"
      ? t("typeXtream")
      : t("typeM3U8");
  };

  if (connections.length === 0) {
    return (
      <div className="mb-6">
        <button
          onClick={onAddNew}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-lg text-primary transition-colors"
        >
          <Plus className="h-5 w-5" />
          {t("addFirst")}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Current Connection Selector */}
      <div className="bg-slate-800/50 rounded-lg border border-white/10 overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/20 rounded-lg">
              {activeConnection && getConnectionIcon(activeConnection)}
            </div>
            <div className="text-left">
              <p className="text-white font-medium">
                {activeConnection?.name || t("noConnection")}
              </p>
              <p className="text-xs text-slate-400">
                {activeConnection && getConnectionTypeLabel(activeConnection)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {connections.length} {t("connectionsCount")}
            </span>
            <ChevronDown
              className={`h-5 w-5 text-slate-400 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Expanded Connection List */}
        {isExpanded && (
          <div className="border-t border-white/10">
            <div className="max-h-64 overflow-y-auto">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className={`flex items-center gap-3 p-3 border-b border-white/5 last:border-b-0 ${
                    activeConnection?.id === connection.id
                      ? "bg-primary/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  {/* Selection Radio */}
                  <button
                    onClick={() => setActiveConnection(connection.id)}
                    className={`flex items-center justify-center w-5 h-5 rounded-full border-2 transition-colors ${
                      activeConnection?.id === connection.id
                        ? "border-primary bg-primary"
                        : "border-slate-500 hover:border-slate-400"
                    }`}
                  >
                    {activeConnection?.id === connection.id && (
                      <Radio className="h-3 w-3 text-white" />
                    )}
                  </button>

                  {/* Connection Info */}
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setActiveConnection(connection.id)}
                  >
                    <p className="text-sm text-white">{connection.name}</p>
                    <p className="text-xs text-slate-500">
                      {getConnectionTypeLabel(connection)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(connection)}
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                      title={t("edit")}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    {confirmDelete === connection.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(connection.id)}
                          className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                          title={t("confirmDelete")}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="p-2 text-slate-400 hover:bg-slate-400/20 rounded-lg transition-colors"
                          title={t("cancelDelete")}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDelete(connection.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title={t("delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Button */}
            <div className="p-3 border-t border-white/10">
              <button
                onClick={onAddNew}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                {t("addNew")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
