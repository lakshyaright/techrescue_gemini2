import React, { useState } from "react";
import {
  X,
  Sparkles,
  AlertCircle,
  Clock,
  ShieldAlert,
  Server,
  Layers,
  MapPin,
  CheckCircle2,
  Cpu,
  Loader2,
} from "lucide-react";
import type { Ticket, TicketUrgency, TicketImpact, SupportType, AIDiagnosticResult } from "../types.ts";
import { api } from "../lib/api.ts";

interface RaiseQueryModalProps {
  onClose: () => void;
  onTicketCreated: (newTicket: Ticket) => void;
}

export const RaiseQueryModal: React.FC<RaiseQueryModalProps> = ({ onClose, onTicketCreated }) => {
  const [shortDesc, setShortDesc] = useState("");
  const [detailedDesc, setDetailedDesc] = useState("");
  const [category, setCategory] = useState("Software");
  const [subcategory, setSubcategory] = useState("Outlook");
  const [impact, setImpact] = useState<TicketImpact>("Single User");
  const [urgency, setUrgency] = useState<TicketUrgency>("Medium");
  const [assignmentGroup, setAssignmentGroup] = useState("Application Support");
  const [supportType, setSupportType] = useState<SupportType>("remote");
  const [location, setLocation] = useState("Mumbai Office / Remote");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiDiagnostics, setAiDiagnostics] = useState<AIDiagnosticResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const subcategoryOptions: Record<string, string[]> = {
    Software: ["Outlook", "Excel", "Word", "Teams", "Chrome", "Edge", "Tally ERP9", "Windows 11", "macOS Sonoma"],
    Hardware: ["Dell PowerEdge", "MacBook Logic Board", "HP ProLiant", "Lenovo ThinkPad", "Battery Swell", "RAM Failure"],
    Application: ["Salesforce CRM", "SAP ERP", "Slack", "Zoom VoIP", "Docker Desktop", "VS Code Server"],
    Network: ["Router", "Firewall", "Cisco Switch", "Ubiquiti UniFi", "IPSec VPN", "BGP Flapping", "DNS Resolution"],
    Security: ["Ransomware Isolation", "Phishing Audit", "Active Directory Lockout", "SSL Expiration", "CrowdStrike Agent"],
    Cloud: ["AWS EC2/VPC", "GCP Kubernetes", "Azure Active Directory", "PostgreSQL Connection Pool", "Terraform Drift"],
  };

  const currentPriority =
    urgency === "Critical" || impact === "Organization"
      ? "P1"
      : urgency === "High"
      ? "P2"
      : urgency === "Medium"
      ? "P3"
      : "P4";

  const slaHours = currentPriority === "P1" ? 1 : currentPriority === "P2" ? 3 : currentPriority === "P3" ? 6 : 12;

  const handleAIAutoEnhance = async () => {
    if (!shortDesc.trim()) {
      setErrorMsg("Please enter a short description or error message first for AI triage.");
      return;
    }

    setErrorMsg("");
    setIsAnalyzingAI(true);

    try {
      const res = await api.diagnoseWithAI(
        `${shortDesc}. ${detailedDesc}`,
        category,
        subcategory
      );

      if (res.diagnostics) {
        setAiDiagnostics(res.diagnostics);
        if (res.diagnostics.suggested_category && subcategoryOptions[res.diagnostics.suggested_category]) {
          setCategory(res.diagnostics.suggested_category);
        }
        if (res.diagnostics.suggested_subcategory) {
          setSubcategory(res.diagnostics.suggested_subcategory);
        }
        if (res.diagnostics.suggested_urgency) {
          setUrgency(res.diagnostics.suggested_urgency);
        }
        if (res.diagnostics.suggested_impact) {
          setImpact(res.diagnostics.suggested_impact);
        }
      }
    } catch (err: any) {
      console.warn("AI enhancement error:", err);
      setErrorMsg("AI triage preview: using high-availability heuristics.");
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortDesc.trim()) {
      setErrorMsg("Short description is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await api.raiseQuery({
        short_description: shortDesc,
        detailed_description: detailedDesc,
        category,
        subcategory,
        impact,
        urgency,
        assignment_group: assignmentGroup,
        support_type: supportType,
        location,
      });

      setSuccessMsg(`Ticket ${res.ticket_number} created successfully.`);
      setTimeout(() => {
        onTicketCreated(res.ticket);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to raise ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 px-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white">Raise Emergency or Routine IT Ticket</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-teal-900 text-teal-300 border border-teal-700">
                HA Triage
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Submit your technical issue for instant remote expert alignment or certified on-site engineer dispatch.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Short Description & AI Auto-Enhance */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Short Summary / Error Headline *
              </label>
              <button
                type="button"
                onClick={handleAIAutoEnhance}
                disabled={isAnalyzingAI}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition"
              >
                {isAnalyzingAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                    <span>Analyzing with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span>AI Auto-Triage & Auto-Fill</span>
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              required
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="e.g. Cisco 4451 Core Router packet loss and high CPU spike"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* AI Diagnostic Preview Banner if generated */}
          {aiDiagnostics && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-teal-900 to-slate-900 text-white text-xs space-y-2 shadow-md">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  Gemini Diagnostic Intelligence
                </span>
                <span className="text-[10px] text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800">
                  Auto-Classified
                </span>
              </div>
              <p className="text-slate-200">
                <strong className="text-white">Root Cause: </strong>
                {aiDiagnostics.root_cause}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {aiDiagnostics.suggested_tools.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">
                    🛠️ {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Categorization Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => {
                  const newCat = e.target.value;
                  setCategory(newCat);
                  setSubcategory(subcategoryOptions[newCat]?.[0] || "General");
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
              >
                {Object.keys(subcategoryOptions).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subcategory *</label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
              >
                {(subcategoryOptions[category] || []).map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Impact, Urgency & SLA Calculator */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Impact *</label>
              <select
                value={impact}
                onChange={(e) => setImpact(e.target.value as TicketImpact)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              >
                <option value="Single User">Single User</option>
                <option value="Multiple Users">Multiple Users</option>
                <option value="Organization">Organization (Org-Wide)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Urgency *</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as TicketUrgency)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical P1</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Calculated Priority & SLA</label>
              <div className="p-2 rounded-lg bg-slate-900 text-white flex items-center justify-between text-xs">
                <span className={`px-2 py-0.5 rounded font-bold ${
                  currentPriority === "P1" ? "bg-rose-600" : currentPriority === "P2" ? "bg-orange-500" : "bg-teal-600"
                }`}>
                  {currentPriority}
                </span>
                <span className="text-[11px] text-slate-300 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  {slaHours}h Target
                </span>
              </div>
            </div>
          </div>

          {/* Support Mode: Remote vs Field On-Site Dispatch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Support Mode *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSupportType("remote")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    supportType === "remote"
                      ? "bg-teal-700 text-white border-teal-700 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <span>💻 Remote Live Rescue</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSupportType("field_onsite")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    supportType === "field_onsite"
                      ? "bg-teal-700 text-white border-teal-700 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <span>🚗 Field On-Site Dispatch</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Location / Site Address *</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. BKC Tower Branch, Mumbai"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Assignment Group */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Assignment Routing Group</label>
            <select
              value={assignmentGroup}
              onChange={(e) => setAssignmentGroup(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
            >
              <option>Application Support</option>
              <option>Network Support</option>
              <option>Hardware Support</option>
              <option>Cloud Support</option>
              <option>Email & Workspace Support</option>
              <option>Cybersecurity Incident Response</option>
            </select>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detailed Diagnostic Notes & Error Logs
            </label>
            <textarea
              rows={4}
              value={detailedDesc}
              onChange={(e) => setDetailedDesc(e.target.value)}
              placeholder="Provide exact error codes, system specifications, troubleshooting already attempted, or impacted users..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none"
            ></textarea>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-md shadow-teal-900 transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Dispatching..." : "Submit & Dispatch Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
