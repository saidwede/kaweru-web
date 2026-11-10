"use client";

import { CheckCircle2, AlertCircle, X } from "lucide-react";
import type { StateSetter } from "./types";

interface FeedbackBannersProps {
  error: string | null;
  setError: StateSetter<string | null>;
  successMessage: string | null;
  setSuccessMessage: StateSetter<string | null>;
}

export default function FeedbackBanners({
  error,
  setError,
  successMessage,
  setSuccessMessage,
}: FeedbackBannersProps) {
  return (
    <>
      {error && (
        <div className="m-4 sm:mx-8 mb-0 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800 p-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="m-4 sm:mx-8 mb-0 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-800 p-1">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
