import React from "react";
import {
  X,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Server,
  Cpu,
  MapPin,
  Building,
  User,
  ShieldCheck,
  Download,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import type { Ticket } from "../types.ts";
import { generateServiceSlipPDF } from "../lib/pdfGenerator.ts";

interface TicketDetailModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  onOpenChat: (ticketNumber: string) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket, onClose, onOpenChat }) => {
  if (!ticket) return null;

  const statusColors = {
    open: "bg-amber-100 text-amber-800 border-amber-300",
    in_progress: "bg-teal-100 text-teal-800 border-teal-300",
    resolved: "bg-emerald-100 text-emerald-800 border-emerald-300",
    closed: "bg-slate-100 text-slate-800 border-slate-300",
    ignored: "bg-rose-100 text-rose-800 border-rose-300",
  };

  const priorityColors = {
    P1: "bg-rose-600 text-white",
    P2: "bg-orange-500 text-white",
    P3: "bg-amber-500 text-white",
    P4: "bg-slate-500 text-white",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-900/90 text-teal-300 border border-teal-700">
                {ticket.ticket_number}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${statusColors[ticket.status]}`}>
                {ticket.status.replace("_", " ")}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${priorityColors[ticket.priority]}`}>
                {ticket.priority} Urgency
              </span>
            </div>
            <h2 className="text-xl font-bold text-white leading-snug">{ticket.short_description}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div>
              <p className="text-slate-500 font-medium">Category</p>
              <p className="font-semibold text-slate-800 mt-0.5">{ticket.category} → {ticket.subcategory}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Support Mode</p>
              <p className="font-semibold text-slate-800 mt-0.5 capitalize">
                {ticket.support_type === "field_onsite" ? "🚗 On-Site Field Dispatch" : "💻 Live Remote Rescue"}
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Target SLA</p>
              <p className="font-semibold text-teal-700 mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{ticket.sla_target_hours} Hours Target</span>
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Raised At</p>
              <p className="font-semibold text-slate-800 mt-0.5">
                {new Date(ticket.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Client & Assigned Engineer Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Client Information</span>
              </p>
              <p className="font-bold text-slate-800 text-sm">{ticket.client_name}</p>
              <p className="text-xs text-slate-600">{ticket.client_email}</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Building className="w-3 h-3" />
                <span>{ticket.client_company || "Direct Client Org"}</span>
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{ticket.location}</span>
              </p>
            </div>

            <div className="p-4 rounded-xl border border-teal-100 bg-teal-50/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Assigned Specialist</span>
              </p>
              {ticket.assigned_engineer_name ? (
                <div>
                  <p className="font-bold text-slate-800 text-sm">{ticket.assigned_engineer_name}</p>
                  <p className="text-xs text-teal-800 font-medium">{ticket.assigned_engineer_role || "Certified Engineer"}</p>
                  <p className="text-xs text-slate-500 mt-2">Active triage in progress on secure edge tunnel.</p>
                </div>
              ) : (
                <div className="text-xs text-slate-500">
                  <p className="font-medium text-amber-700">Awaiting engineer dispatch pool assignment.</p>
                  <p className="mt-1">Ticket broadcasted to verified specialists.</p>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Problem Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Issue Diagnostic Details</h4>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {ticket.detailed_description || ticket.short_description}
            </div>
          </div>

          {/* AI Diagnostic Findings if available */}
          {ticket.ai_diagnostics && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-teal-900 to-slate-900 text-white shadow-lg space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Sparkles className="w-4 h-4" />
                <h4 className="font-bold text-sm">Automated Diagnostic Intelligence</h4>
              </div>
              <div className="text-xs space-y-2">
                <div>
                  <span className="text-slate-400 font-medium">Likely Root Cause: </span>
                  <span className="text-slate-100">{ticket.ai_diagnostics.root_cause}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Remediation Steps:</span>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-slate-200 pl-1">
                    {ticket.ai_diagnostics.recommended_actions.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {ticket.ai_diagnostics.suggested_tools.map((tool, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-700 text-[10px]">
                      Tool: {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Resolution Note if resolved */}
          {ticket.resolution_note && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-sm mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Engineer Resolution & Closure Note</span>
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed">{ticket.resolution_note}</p>
              {ticket.resolved_at && (
                <p className="text-[11px] text-emerald-700 font-medium mt-2">
                  Resolved on: {new Date(ticket.resolved_at).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => onOpenChat(ticket.ticket_number)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open Real-Time Chat</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => generateServiceSlipPDF(ticket)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Service Slip</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
