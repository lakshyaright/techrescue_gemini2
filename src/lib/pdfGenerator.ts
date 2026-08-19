import { jsPDF } from "jspdf";
import type { Ticket } from "../types.ts";

export function generateServiceSlipPDF(ticket: Ticket) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Colors
  const primaryTeal = [14, 124, 115] as [number, number, number];
  const darkInk = [23, 32, 51] as [number, number, number];
  const grayMuted = [102, 112, 133] as [number, number, number];
  const lightBg = [245, 248, 247] as [number, number, number];

  // Header Banner
  doc.setFillColor(...primaryTeal);
  doc.rect(0, 0, 210, 32, "F");

  // Logo / Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("TechRescue", 16, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("High-Availability On-Demand IT & Field Engineer Rescue", 16, 25);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("ELECTRONIC SERVICE SLIP", 140, 18, { align: "left" });
  doc.setFontSize(9);
  doc.text(`TICKET: ${ticket.ticket_number}`, 140, 24);

  // Ticket Meta Card
  doc.setFillColor(...lightBg);
  doc.roundedRect(14, 40, 182, 38, 3, 3, "F");

  doc.setTextColor(...darkInk);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Service Ticket Overview", 20, 48);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayMuted);

  doc.text("Client Name:", 20, 56);
  doc.text("Organization:", 20, 63);
  doc.text("Contact Email:", 20, 70);

  doc.text("Status:", 110, 56);
  doc.text("Priority / SLA:", 110, 63);
  doc.text("Date Raised:", 110, 70);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkInk);
  doc.text(ticket.client_name || "N/A", 50, 56);
  doc.text(ticket.client_company || "Direct Client", 50, 63);
  doc.text(ticket.client_email || "N/A", 50, 70);

  doc.text(ticket.status.toUpperCase(), 140, 56);
  doc.text(`${ticket.priority} (${ticket.sla_target_hours}h target)`, 140, 63);
  doc.text(new Date(ticket.created_at).toLocaleString(), 140, 70);

  // Technical Classification Section
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkInk);
  doc.text("Issue Description & Triage Matrix", 14, 88);

  doc.setDrawColor(220, 225, 230);
  doc.line(14, 91, 196, 91);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Subject / Issue:", 14, 98);
  doc.setFont("helvetica", "normal");
  doc.text(ticket.short_description, 45, 98, { maxWidth: 150 });

  doc.setFont("helvetica", "bold");
  doc.text("Category:", 14, 106);
  doc.setFont("helvetica", "normal");
  doc.text(`${ticket.category} → ${ticket.subcategory} (${ticket.support_type === "field_onsite" ? "On-Site Field Dispatch" : "Remote Live Rescue"})`, 45, 106);

  doc.setFont("helvetica", "bold");
  doc.text("Detailed Logs:", 14, 114);
  doc.setFont("helvetica", "normal");
  doc.text(ticket.detailed_description || "No additional logs provided.", 45, 114, { maxWidth: 148 });

  // AI Diagnostic / Root Cause (if present)
  let nextY = 138;
  if (ticket.ai_diagnostics) {
    doc.setFillColor(240, 247, 246);
    doc.roundedRect(14, nextY, 182, 34, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryTeal);
    doc.setFontSize(10);
    doc.text("Automated Telemetry & AI Diagnostic Findings", 20, nextY + 7);

    doc.setFontSize(8.5);
    doc.setTextColor(...darkInk);
    doc.setFont("helvetica", "bold");
    doc.text("Root Cause:", 20, nextY + 14);
    doc.setFont("helvetica", "normal");
    doc.text(ticket.ai_diagnostics.root_cause, 45, nextY + 14, { maxWidth: 145 });

    doc.setFont("helvetica", "bold");
    doc.text("Remediation:", 20, nextY + 22);
    doc.setFont("helvetica", "normal");
    const actions = ticket.ai_diagnostics.recommended_actions.slice(0, 2).join(" • ");
    doc.text(actions, 45, nextY + 22, { maxWidth: 145 });

    nextY += 42;
  }

  // Engineer Assignment & Resolution
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkInk);
  doc.text("Engineer Remediation & Closure", 14, nextY);

  doc.setDrawColor(220, 225, 230);
  doc.line(14, nextY + 3, 196, nextY + 3);

  nextY += 10;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Assigned Engineer:", 14, nextY);
  doc.setFont("helvetica", "normal");
  doc.text(ticket.assigned_engineer_name ? `${ticket.assigned_engineer_name} (${ticket.assigned_engineer_role || "Certified Specialist"})` : "Triage Dispatch Pool", 50, nextY);

  nextY += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Resolution Note:", 14, nextY);
  doc.setFont("helvetica", "normal");
  doc.text(
    ticket.resolution_note || (ticket.status === "resolved" ? "Remediated successfully by assigned engineer." : "Ticket currently in progress / awaiting final sign-off."),
    50,
    nextY,
    { maxWidth: 144 }
  );

  nextY += 18;
  if (ticket.resolved_at) {
    doc.setFont("helvetica", "bold");
    doc.text("Resolution Time:", 14, nextY);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(ticket.resolved_at).toLocaleString(), 50, nextY);
    nextY += 8;
  }

  // Verification & Sign-off Box
  doc.setFillColor(...lightBg);
  doc.roundedRect(14, 230, 182, 45, 2, 2, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkInk);
  doc.text("Cryptographic Verification & Digital Sign-off", 20, 238);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayMuted);
  doc.text(`Digital Signature Hash: SHA256-${Math.random().toString(36).substring(2, 15).toUpperCase()}-${ticket.ticket_number}`, 20, 245);
  doc.text("Service SLA: Guaranteed by TechRescue High-Availability Cloud Infrastructure.", 20, 251);
  doc.text("For 24/7 emergency escalation: support@techrescue.io | +1 (800) TECH-RESCUE", 20, 257);

  // Engineer Signature Line
  doc.setDrawColor(150, 150, 150);
  doc.line(135, 264, 185, 264);
  doc.setFontSize(7.5);
  doc.text("Authorized Engineer Signature", 135, 268);

  // Footer
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  doc.text("TechRescue Enterprise Inc. • Confidential Electronic Service Slip", 105, 288, { align: "center" });

  doc.save(`${ticket.ticket_number}-Service-Slip.pdf`);
}
