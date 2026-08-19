import React from "react";
import { MessageSquare, X, ArrowRight, Shield } from "lucide-react";
import type { TicketMessage } from "../types.ts";

interface ChatNotificationToastProps {
  message: TicketMessage;
  onOpenChat: (ticketNumber: string) => void;
  onDismiss: () => void;
}

export const ChatNotificationToast: React.FC<ChatNotificationToastProps> = ({
  message,
  onOpenChat,
  onDismiss,
}) => {
  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md w-full bg-slate-900/98 text-white rounded-2xl shadow-2xl border-2 border-teal-500/80 p-4 backdrop-blur animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center font-bold text-white shrink-0 shadow-md">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">{message.sender_name}</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-700">
                {message.ticket_number}
              </span>
            </div>
            <p className="text-[11px] text-teal-400 font-medium capitalize">
              {message.sender_role.replace("_", " ")} Message
            </p>
            <p className="text-xs text-slate-300 mt-1.5 leading-snug line-clamp-3 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
              "{message.message}"
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
          title="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3.5 pt-2.5 border-t border-slate-800 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        <button
          onClick={() => {
            onOpenChat(message.ticket_number);
            onDismiss();
          }}
          className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <span>Open Ticket Chat</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
