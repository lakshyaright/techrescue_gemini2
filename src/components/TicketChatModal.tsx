import React, { useState, useEffect, useRef } from "react";
import { X, Send, User, Bot, Clock, Sparkles } from "lucide-react";
import type { TicketMessage, User as UserType } from "../types.ts";
import { api } from "../lib/api.ts";

interface TicketChatModalProps {
  ticketNumber: string;
  currentUser: UserType | null;
  onClose: () => void;
}

export const TicketChatModal: React.FC<TicketChatModalProps> = ({ ticketNumber, currentUser, onClose }) => {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    try {
      const data = await api.getMessages(ticketNumber);
      setMessages(data);
    } catch (err) {
      console.error("Error loading chat messages:", err);
    }
  };

  useEffect(() => {
    loadMessages();

    // Direct Firestore real-time snapshot subscription
    const unsub = api.subscribeToMessages(ticketNumber, (msgs) => {
      if (msgs && msgs.length > 0) {
        setMessages(msgs);
      }
    });

    return () => unsub();
  }, [ticketNumber]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const msgToSend = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      await api.sendMessage(ticketNumber, msgToSend);
      await loadMessages();
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const quickSnippets = [
    "Could you please share the error code or screenshot?",
    "Network trace completed; starting remote config rollout now.",
    "Issue resolved on our end. Please verify and confirm.",
    "On-site engineer is en route with replacement hardware.",
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full h-[640px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center font-bold text-sm text-white">
              TR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Real-Time Ticket Chat</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-teal-900 text-teal-300 border border-teal-700">
                  {ticketNumber}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Encrypted 2-Way High-Availability Session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Bot className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>No messages yet in this ticket conversation.</p>
              <p className="mt-1">Send a message below to coordinate with the specialist.</p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender_id === currentUser?.id;
              const isSystem = m.is_automated || m.sender_role === "admin";

              if (isSystem) {
                return (
                  <div key={m.id} className="flex justify-center my-2">
                    <div className="bg-slate-200/80 text-slate-700 border border-slate-300 text-[11px] px-3 py-1.5 rounded-full max-w-md text-center">
                      <span className="font-semibold">{m.sender_name}: </span>
                      <span>{m.message}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={m.id} className={`flex gap-2.5 ${isMe ? "justify-end" : "justify-start"}`}>
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold mt-1 shrink-0">
                      {m.sender_name?.slice(0, 2).toUpperCase() || "EX"}
                    </div>
                  )}

                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                      isMe
                        ? "bg-teal-700 text-white rounded-tr-xs"
                        : "bg-white text-slate-800 border border-slate-200 rounded-tl-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className={`font-bold ${isMe ? "text-teal-100" : "text-slate-900"}`}>
                        {isMe ? "You" : m.sender_name}
                      </span>
                      <span className={`text-[10px] ${isMe ? "text-teal-200" : "text-slate-400"}`}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
                  </div>

                  {isMe && (
                    <div className="w-7 h-7 rounded-full bg-teal-800 text-white flex items-center justify-center text-[10px] font-bold mt-1 shrink-0">
                      {currentUser?.first_name?.[0] || "U"}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Canned Responses */}
        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
          <span className="text-slate-500 font-medium whitespace-nowrap flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal-600" /> Quick:
          </span>
          {quickSnippets.map((snip, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(snip)}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-teal-50 border border-slate-300 text-slate-700 whitespace-nowrap text-[11px] transition"
            >
              {snip.slice(0, 32)}...
            </button>
          ))}
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message, error code, or update..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="px-4 py-2.5 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
