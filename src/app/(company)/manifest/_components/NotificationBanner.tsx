"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { NotificationMsg } from "./types";

interface NotificationBannerProps {
  notificationMsg: NotificationMsg;
  setNotificationMsg: Dispatch<SetStateAction<NotificationMsg | null>>;
}

export default function NotificationBanner({
  notificationMsg,
  setNotificationMsg,
}: NotificationBannerProps) {
  return (
    <div
      className={`mx-4 sm:mx-8 mt-4 p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-xs ${
        notificationMsg.type === "success"
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : notificationMsg.type === "error"
          ? "bg-red-50 border-red-200 text-red-800"
          : "bg-blue-50 border-blue-200 text-blue-800"
      }`}
    >
      <div className="flex items-center gap-2.5">
        {notificationMsg.type === "success" ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-600" />
        )}
        <span>{notificationMsg.text}</span>
      </div>
      <button onClick={() => setNotificationMsg(null)} className="font-black p-1">
        ✕
      </button>
    </div>
  );
}
