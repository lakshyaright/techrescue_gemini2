import React, { useState } from "react";
import {
  ShieldAlert,
  Server,
  Wrench,
  Sparkles,
  Zap,
  Globe,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  MapPin,
  Cpu,
  Layers,
  Star,
  Users,
  Search,
  Loader2,
} from "lucide-react";
import { api } from "../lib/api.ts";
import type { AIDiagnosticResult } from "../types.ts";

interface PublicLandingProps {
  onOpenRaiseModal: () => void;
  onNavigateToClient: () => void;
  onNavigateToExpert: () => void;
  onNavigateToOps: () => void;
}

export const PublicLanding: React.FC<PublicLandingProps> = ({
  onOpenRaiseModal,
  onNavigateToClient,
  onNavigateToExpert,
  onNavigateToOps,
}) => {
  // Interactive Diagnostic Simulator state
  const [simQuery, setSimQuery] = useState("Cisco switch trunk port flapping causing packet loss on VLAN 20");
  const [simCategory, setSimCategory] = useState("Network");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<AIDiagnosticResult | null>(null);

  const sampleQueries = [
    { label: "Network Flap", query: "Cisco switch trunk port flapping causing packet loss on VLAN 20", cat: "Network" },
    { label: "PostgreSQL Crash", query: "PostgreSQL database connections exhausted max_connections 500 error 503", cat: "Cloud" },
    { label: "Laptop Logic Board", query: "Dell Latitude laptop power button blinking amber 3 times no POST", cat: "Hardware" },
    { label: "Ransomware Alert", query: "Workstation files encrypted with .lock extension Active Directory locked", cat: "Security" },
  ];

  const handleRunSim = async (queryText?: string, catText?: string) => {
    const q = queryText || simQuery;
    const cat = catText || simCategory;
    setIsSimulating(true);
    try {
      const res = await api.diagnoseWithAI(q, cat);
      setSimResult(res.diagnostics);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-16 py-8 pb-20 animate-in fade-in">
      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-8 sm:p-14 text-white shadow-2xl border border-slate-800 overflow-hidden">
          {/* Subtle glow accent */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-800 text-teal-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>High-Availability Edge Cluster Active • 99.994% SLA</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Enterprise IT & Field Rescue. <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">Dispatched in Minutes.</span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
              From critical cloud outages and network firewall flaps to on-site motherboard and rack hardware replacements. Connect with vetted Tier-3 engineers with automated telemetry and electronic service slips.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onOpenRaiseModal}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-teal-950 transition active:scale-95 flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Raise Emergency Ticket</span>
              </button>

              <button
                onClick={onNavigateToClient}
                className="px-6 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                <span>Browse Specialists</span>
              </button>

              <button
                onClick={onNavigateToOps}
                className="px-5 py-3.5 rounded-xl text-slate-300 hover:text-white font-semibold text-sm hover:bg-slate-800/50 transition flex items-center gap-1.5"
              >
                <Server className="w-4 h-4 text-indigo-400" />
                <span>HA Topology</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics Ticker */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-slate-800/80 text-xs">
              <div>
                <p className="text-2xl font-extrabold text-white">12 mins</p>
                <p className="text-slate-400 mt-0.5">Avg. Emergency Response</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-teal-400">99.994%</p>
                <p className="text-slate-400 mt-0.5">Platform Availability</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white">500+</p>
                <p className="text-slate-400 mt-0.5">Certified Field Engineers</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-amber-400">4.95 / 5</p>
                <p className="text-slate-400 mt-0.5">Verified CSAT Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE AI DIAGNOSTICS BENCH */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Live Interactive Diagnostics Bench</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                Test Instant AI-Powered Issue Triage & Root Cause Engine
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Powered by server-side Gemini intelligence. Experience how TechRescue categorizes problems, calculates SLA priorities, and recommends remediation toolsets.
              </p>
            </div>
            <span className="text-xs font-mono bg-teal-50 text-teal-800 px-3 py-1.5 rounded-xl border border-teal-200 font-semibold">
              Model: Gemini Flash
            </span>
          </div>

          {/* Preset Clickers */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-medium mr-1">Quick Scenarios:</span>
            {sampleQueries.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSimQuery(s.query);
                  setSimCategory(s.cat);
                  handleRunSim(s.query, s.cat);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 text-xs font-medium border border-slate-200 transition"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Interactive Input Form */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={simQuery}
              onChange={(e) => setSimQuery(e.target.value)}
              placeholder="Describe an error code, system crash, or hardware symptom..."
              className="flex-1 w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none font-medium"
            />
            <button
              onClick={() => handleRunSim()}
              disabled={isSimulating || !simQuery.trim()}
              className="w-full sm:w-auto px-6 py-3 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Diagnosing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Live Triage</span>
                </>
              )}
            </button>
          </div>

          {/* Simulation Output Card */}
          {simResult && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-xl space-y-4 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Automated Diagnostic Classification
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded bg-teal-900 text-teal-300 border border-teal-700 font-mono">
                    Urgency: {simResult.suggested_urgency}
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-amber-900 text-amber-300 border border-amber-700 font-mono">
                    Impact: {simResult.suggested_impact}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Identified Root Cause</p>
                  <p className="text-slate-100 font-medium leading-relaxed bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                    {simResult.root_cause}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Recommended Action Steps</p>
                  <ul className="space-y-1 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                    {simResult.recommended_actions.map((act, i) => (
                      <li key={i} className="text-slate-200 flex items-start gap-1.5">
                        <span className="text-teal-400 font-bold">•</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap gap-1.5">
                  {simResult.suggested_tools.map((tool, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 text-[10px] font-medium border border-teal-800">
                      🛠️ {tool}
                    </span>
                  ))}
                </div>

                <button
                  onClick={onOpenRaiseModal}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                >
                  <span>Dispatch This Ticket</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CORE PILLARS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Dual-Engine Technical Rescue Model
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Seamlessly bridging high-speed remote cloud triage with on-the-ground certified hardware field engineers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pillar 1: Remote */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs hover:shadow-md transition space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Instant Remote SLA Rescue</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Connect via encrypted secure edge tunnels directly with senior Cloud Architects and Network Specialists. Instant resolution for firewall rule conflicts, Kubernetes pod crashes, SSL certificate renewals, and email delivery failures.
            </p>
            <ul className="space-y-2 text-xs text-slate-700 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Sub-15 minute emergency triage guarantee</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Multi-cloud support (AWS, GCP, Azure, On-Prem Linux)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Interactive live terminal & screen-share sessions</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2: Field On-Site */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs hover:shadow-md transition space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Certified Field On-Site Dispatch</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hardware failures cannot be solved over Zoom. Our nationwide field dispatch network sends certified engineers equipped with diagnostic oscilloscopes, logic board testers, and replacement components straight to your office or server room.
            </p>
            <ul className="space-y-2 text-xs text-slate-700 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>Available across Mumbai, Bengaluru, Delhi NCR, Pune & Global hubs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>Server rack-and-stack, UPS battery replacement, fiber splicing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>Same-day physical arrival with verified background checks</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SERVICE SLIPS & COMPLIANCE SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 flex flex-wrap items-center justify-between gap-8">
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
              <FileCheck className="w-4 h-4" />
              <span>Audit-Ready ITIL Compliance</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Cryptographically Verified Electronic Service Slips
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every completed triage generates a tamper-proof PDF service slip containing SHA-256 digital signatures, resolution timestamps, engineer credentials, and full diagnostic telemetry for your compliance and insurance audits.
            </p>
            <div className="pt-2">
              <button
                onClick={onNavigateToClient}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                Inspect Sample Slips in History →
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 max-w-sm w-full space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-mono text-teal-300">TR-8941-SLIP.PDF</span>
              <span className="text-emerald-400 font-bold">VERIFIED</span>
            </div>
            <div className="space-y-1.5 text-slate-300">
              <p><strong>Engineer:</strong> Rajesh Kumar (L3 Field Spec)</p>
              <p><strong>Resolved:</strong> Cisco 4451 Core Router Swap</p>
              <p><strong>SLA Target:</strong> 1.0 hr (Delivered in 42 min)</p>
              <p className="font-mono text-[10px] text-slate-500 truncate">SHA256: 9f8a812b7a9e52e4...</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
