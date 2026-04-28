"""Generates a multi-page customer diagnostic & remediation PDF report."""
from datetime import datetime
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
)
from reportlab.platypus.flowables import KeepTogether, Flowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

# ---------- Color palette (matches site theme) ----------
NAVY = colors.HexColor("#0B3B82")
NAVY_DARK = colors.HexColor("#0a2860")
SLATE = colors.HexColor("#0f172a")
SLATE_500 = colors.HexColor("#64748b")
SLATE_100 = colors.HexColor("#f1f5f9")
GREEN = colors.HexColor("#15803d")
GREEN_LIGHT = colors.HexColor("#dcfce7")
AMBER = colors.HexColor("#b45309")
AMBER_LIGHT = colors.HexColor("#fef3c7")
RED = colors.HexColor("#b91c1c")
RED_LIGHT = colors.HexColor("#fee2e2")
WHITE = colors.white


# ---------- Custom flowable: Threat-flow diagram ----------
class ThreatFlowDiagram(Flowable):
    """Diagram: Compromised server → dark web → remediation pipeline."""
    def __init__(self, width=6.5 * inch, height=2.4 * inch):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height

        # Layer 1 — Threat sources
        c.setFillColor(RED_LIGHT); c.setStrokeColor(RED)
        c.roundRect(0, h - 0.6 * inch, 1.6 * inch, 0.55 * inch, 6, stroke=1, fill=1)
        c.setFillColor(RED); c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(0.8 * inch, h - 0.3 * inch, "COMPROMISED SOURCE")
        c.setFont("Helvetica", 8)
        c.drawCentredString(0.8 * inch, h - 0.45 * inch, "Hostile foreign server")

        # Arrow 1
        c.setStrokeColor(SLATE_500); c.setLineWidth(1.2)
        c.line(1.6 * inch, h - 0.32 * inch, 2.2 * inch, h - 0.32 * inch)
        c.line(2.15 * inch, h - 0.27 * inch, 2.2 * inch, h - 0.32 * inch)
        c.line(2.15 * inch, h - 0.37 * inch, 2.2 * inch, h - 0.32 * inch)

        # Layer 2 — Dark Web
        c.setFillColor(SLATE); c.setStrokeColor(SLATE)
        c.roundRect(2.2 * inch, h - 0.6 * inch, 1.6 * inch, 0.55 * inch, 6, stroke=1, fill=1)
        c.setFillColor(WHITE); c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(3.0 * inch, h - 0.3 * inch, "DARK WEB MARKETS")
        c.setFont("Helvetica", 8)
        c.drawCentredString(3.0 * inch, h - 0.45 * inch, "PII listed for sale")

        # Arrow 2
        c.setStrokeColor(SLATE_500)
        c.line(3.8 * inch, h - 0.32 * inch, 4.4 * inch, h - 0.32 * inch)
        c.line(4.35 * inch, h - 0.27 * inch, 4.4 * inch, h - 0.32 * inch)
        c.line(4.35 * inch, h - 0.37 * inch, 4.4 * inch, h - 0.32 * inch)

        # Layer 3 — Customer
        c.setFillColor(AMBER_LIGHT); c.setStrokeColor(AMBER)
        c.roundRect(4.4 * inch, h - 0.6 * inch, 1.8 * inch, 0.55 * inch, 6, stroke=1, fill=1)
        c.setFillColor(AMBER); c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(5.3 * inch, h - 0.3 * inch, "TARGET: S. BURSTEIN")
        c.setFont("Helvetica", 8)
        c.drawCentredString(5.3 * inch, h - 0.45 * inch, "SSN, email, devices, address")

        # Vertical drop into remediation
        c.setStrokeColor(SLATE_500); c.setDash(2, 2)
        c.line(3.0 * inch, h - 0.6 * inch, 3.0 * inch, h - 1.1 * inch)
        c.setDash()
        c.line(2.95 * inch, h - 1.05 * inch, 3.0 * inch, h - 1.1 * inch)
        c.line(3.05 * inch, h - 1.05 * inch, 3.0 * inch, h - 1.1 * inch)

        # Layer 4 — Remediation pipeline (4 nodes)
        nodes = [
            (0.05, "1. SERVER\nDESTROYED"),
            (1.65, "2. AUTHORITIES\nNOTIFIED"),
            (3.25, "3. CREDIT\nBUREAUS LOCKED"),
            (4.85, "4. MICROSOFT\nSECURE NODE"),
        ]
        for x_in, label in nodes:
            c.setFillColor(GREEN_LIGHT); c.setStrokeColor(GREEN)
            c.roundRect(x_in * inch, h - 1.85 * inch, 1.5 * inch, 0.7 * inch, 6, stroke=1, fill=1)
            c.setFillColor(GREEN); c.setFont("Helvetica-Bold", 8)
            for i, line in enumerate(label.split("\n")):
                c.drawCentredString((x_in + 0.75) * inch, h - (1.32 + i * 0.16) * inch, line)

        # Footer label
        c.setFillColor(SLATE_500); c.setFont("Helvetica-Oblique", 7)
        c.drawCentredString(w / 2, 0.05 * inch, "Figure 1 — Threat propagation & GTS remediation pipeline")


class SecureNodeDiagram(Flowable):
    """Diagram: Microsoft dedicated secure node architecture."""
    def __init__(self, width=6.5 * inch, height=2.2 * inch):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height

        # Outer frame: Microsoft Azure shield
        c.setStrokeColor(NAVY); c.setLineWidth(1.5)
        c.setDash(4, 2)
        c.roundRect(0.1 * inch, 0.4 * inch, w - 0.2 * inch, h - 0.6 * inch, 8, stroke=1, fill=0)
        c.setDash()
        c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 9)
        c.drawString(0.25 * inch, h - 0.25 * inch, "MICROSOFT-PROVISIONED DEDICATED SECURITY NODE  ·  12-MONTH MASKED IP TENURE")

        # Customer device (left)
        c.setFillColor(SLATE_100); c.setStrokeColor(SLATE)
        c.roundRect(0.4 * inch, 1.1 * inch, 1.3 * inch, 0.9 * inch, 6, stroke=1, fill=1)
        c.setFillColor(SLATE); c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(1.05 * inch, 1.75 * inch, "CUSTOMER")
        c.setFont("Helvetica", 8)
        c.drawCentredString(1.05 * inch, 1.55 * inch, "Sanford B.")
        c.drawCentredString(1.05 * inch, 1.4 * inch, "10 devices")
        c.drawCentredString(1.05 * inch, 1.25 * inch, "(VIP plan)")

        # Encrypted tunnel arrow
        c.setStrokeColor(NAVY); c.setLineWidth(2)
        c.line(1.7 * inch, 1.55 * inch, 2.6 * inch, 1.55 * inch)
        c.line(2.55 * inch, 1.6 * inch, 2.6 * inch, 1.55 * inch)
        c.line(2.55 * inch, 1.5 * inch, 2.6 * inch, 1.55 * inch)
        c.setFillColor(NAVY); c.setFont("Helvetica-Bold", 7)
        c.drawCentredString(2.15 * inch, 1.65 * inch, "AES-256 TUNNEL")
        c.setFont("Helvetica", 7); c.setFillColor(SLATE_500)
        c.drawCentredString(2.15 * inch, 1.4 * inch, "1.5 Gbps")

        # Microsoft node (center)
        c.setFillColor(NAVY); c.setStrokeColor(NAVY_DARK)
        c.roundRect(2.6 * inch, 0.95 * inch, 1.8 * inch, 1.2 * inch, 8, stroke=1, fill=1)
        c.setFillColor(WHITE); c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(3.5 * inch, 1.85 * inch, "MICROSOFT NODE")
        c.setFont("Helvetica", 8)
        c.drawCentredString(3.5 * inch, 1.65 * inch, "IP MASKING ENGINE")
        c.setFont("Helvetica", 7)
        c.drawCentredString(3.5 * inch, 1.5 * inch, "• 24/7 traffic inspection")
        c.drawCentredString(3.5 * inch, 1.35 * inch, "• Geo-anchored (US-East)")
        c.drawCentredString(3.5 * inch, 1.2 * inch, "• Rotating egress IPs")
        c.drawCentredString(3.5 * inch, 1.05 * inch, "• 12-month VIP tenure")

        # Outbound to internet
        c.setStrokeColor(NAVY); c.setLineWidth(2)
        c.line(4.4 * inch, 1.55 * inch, 5.3 * inch, 1.55 * inch)
        c.line(5.25 * inch, 1.6 * inch, 5.3 * inch, 1.55 * inch)
        c.line(5.25 * inch, 1.5 * inch, 5.3 * inch, 1.55 * inch)

        # Internet cloud
        c.setFillColor(GREEN_LIGHT); c.setStrokeColor(GREEN)
        c.roundRect(5.3 * inch, 1.1 * inch, 1.0 * inch, 0.9 * inch, 18, stroke=1, fill=1)
        c.setFillColor(GREEN); c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(5.8 * inch, 1.7 * inch, "INTERNET")
        c.setFont("Helvetica", 7)
        c.drawCentredString(5.8 * inch, 1.5 * inch, "Banks · Email")
        c.drawCentredString(5.8 * inch, 1.38 * inch, "Crypto · Cloud")
        c.drawCentredString(5.8 * inch, 1.26 * inch, "(masked origin)")

        # Footer label
        c.setFillColor(SLATE_500); c.setFont("Helvetica-Oblique", 7)
        c.drawCentredString(w / 2, 0.18 * inch, "Figure 2 — Customer ↔ Microsoft secure node ↔ Internet (masked egress)")


# ---------- Page header / footer ----------
def _draw_header_footer(canvas, doc):
    canvas.saveState()
    width, height = letter
    # Header bar
    canvas.setFillColor(NAVY)
    canvas.rect(0, height - 0.55 * inch, width, 0.55 * inch, stroke=0, fill=1)
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 10)
    canvas.drawString(0.5 * inch, height - 0.32 * inch, "GLOBAL TECH SOLUTIONS")
    canvas.setFont("Helvetica", 8)
    canvas.drawString(0.5 * inch, height - 0.45 * inch, "Confidential Diagnostic & Remediation Report")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(width - 0.5 * inch, height - 0.32 * inch, "1-800-592-5935")
    canvas.drawRightString(width - 0.5 * inch, height - 0.45 * inch, "support@globaltechsolutions.com")

    # Footer
    canvas.setStrokeColor(colors.HexColor("#cbd5e1"))
    canvas.line(0.5 * inch, 0.55 * inch, width - 0.5 * inch, 0.55 * inch)
    canvas.setFillColor(SLATE_500)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(0.5 * inch, 0.4 * inch, "© Global Tech Solutions · Confidential — for the named recipient only")
    canvas.drawRightString(width - 0.5 * inch, 0.4 * inch, f"Page {doc.page}")
    canvas.setFont("Helvetica-Oblique", 7)
    canvas.drawString(0.5 * inch, 0.25 * inch, "Independent technical-support provider · Not affiliated with Microsoft, Apple, Google, or any government agency.")
    canvas.restoreState()


# ---------- Styles ----------
def _styles():
    s = getSampleStyleSheet()
    s.add(ParagraphStyle("CoverEyebrow", fontName="Helvetica-Bold", fontSize=10,
                         textColor=NAVY, spaceAfter=6, alignment=TA_LEFT, leading=12,
                         tracking=2))
    s.add(ParagraphStyle("CoverTitle", fontName="Helvetica-Bold", fontSize=26,
                         textColor=SLATE, spaceAfter=12, leading=30))
    s.add(ParagraphStyle("CoverSub", fontName="Helvetica", fontSize=12,
                         textColor=SLATE_500, spaceAfter=24, leading=17))
    s.add(ParagraphStyle("GtsH1", fontName="Helvetica-Bold", fontSize=16,
                         textColor=NAVY, spaceBefore=8, spaceAfter=10, leading=20))
    s.add(ParagraphStyle("GtsH2", fontName="Helvetica-Bold", fontSize=12,
                         textColor=SLATE, spaceBefore=10, spaceAfter=6, leading=15))
    s.add(ParagraphStyle("GtsBody", fontName="Helvetica", fontSize=10,
                         textColor=SLATE, leading=14, alignment=TA_JUSTIFY, spaceAfter=8))
    s.add(ParagraphStyle("GtsBullet", fontName="Helvetica", fontSize=10,
                         textColor=SLATE, leading=14, leftIndent=12, bulletIndent=2, spaceAfter=4))
    s.add(ParagraphStyle("Callout", fontName="Helvetica-Bold", fontSize=10,
                         textColor=NAVY, leading=14, alignment=TA_LEFT, spaceAfter=6))
    s.add(ParagraphStyle("Small", fontName="Helvetica", fontSize=8,
                         textColor=SLATE_500, leading=11, spaceAfter=4))
    return s


# ---------- Generator ----------
def generate_diagnostic_report(
    output_path: str,
    customer_name: str = "Sanford Burstein",
    customer_id_label: str = "VIP-2017-1102-SB",
    address: str = "36 Greenwood Ave, West Orange, NJ 07052",
    plan: str = "Lifetime VIP Plan",
    incident_id: str = "GTS-IR-2026-0214",
    technician_name: str = "Mike Ungaro",
    technician_cert: str = "Microsoft Certified · #493919583919 · Level 2",
    issue_date: str | None = None,
):
    """Build the PDF at the given output path."""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    issue_date = issue_date or datetime.now().strftime("%B %d, %Y")
    s = _styles()

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=0.55 * inch,
        rightMargin=0.55 * inch,
        topMargin=0.85 * inch,
        bottomMargin=0.7 * inch,
        title=f"GTS Diagnostic Report — {customer_name}",
        author="Global Tech Solutions",
    )
    flow = []

    # =================== PAGE 1 — COVER + EXECUTIVE SUMMARY ===================
    flow.append(Spacer(1, 0.4 * inch))
    flow.append(Paragraph("CONFIDENTIAL · INCIDENT RESPONSE", s["CoverEyebrow"]))
    flow.append(Paragraph("Diagnostic & Remediation Report", s["CoverTitle"]))
    flow.append(Paragraph(
        "Personally-identifiable information exposure on dark-web markets — full forensic findings, containment actions, and forward-looking protections deployed for your account.",
        s["CoverSub"]
    ))

    # Cover summary table
    cover_data = [
        ["Prepared for", customer_name],
        ["Customer ID", customer_id_label],
        ["Service address", address],
        ["Plan", plan],
        ["Incident ID", incident_id],
        ["Lead technician", technician_name],
        ["Technician credentials", technician_cert],
        ["Report issued", issue_date],
        ["Severity", "HIGH (contained)"],
        ["Overall status", "REMEDIATED · Continuous monitoring active"],
    ]
    t = Table(cover_data, colWidths=[1.8 * inch, 4.6 * inch])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("TEXTCOLOR", (0, 0), (0, -1), SLATE_500),
        ("TEXTCOLOR", (1, 0), (1, -1), SLATE),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, colors.HexColor("#e2e8f0")),
        ("BACKGROUND", (0, 8), (-1, 8), AMBER_LIGHT),
        ("BACKGROUND", (0, 9), (-1, 9), GREEN_LIGHT),
        ("TEXTCOLOR", (1, 8), (1, 8), AMBER),
        ("TEXTCOLOR", (1, 9), (1, 9), GREEN),
    ]))
    flow.append(t)
    flow.append(Spacer(1, 0.3 * inch))

    flow.append(Paragraph("Executive summary", s["GtsH1"]))
    flow.append(Paragraph(
        "During scheduled VIP threat-monitoring on your account, our security operations team confirmed multiple instances "
        f"in which {customer_name}'s personally-identifiable information (PII) — including legal name, residential address, "
        "Social Security Number, financial routing details and historical email addresses — had been listed for sale on "
        "monitored dark-web marketplaces. The originating compromise was traced to a hostile foreign-hosted server outside "
        "U.S. jurisdiction.",
        s["GtsBody"]
    ))
    flow.append(Paragraph(
        "Containment was completed within the same operational window. The hostile server was rendered inoperable, "
        "credit bureaus and the Social Security Administration were formally notified, and the customer's egress traffic "
        "was migrated onto a Microsoft-provisioned dedicated security node with a 12-month masked-IP tenure. "
        "All ten devices on the customer's Lifetime VIP plan are now operating behind this hardened perimeter.",
        s["GtsBody"]
    ))
    flow.append(PageBreak())

    # =================== PAGE 2 — DETAILED FINDINGS ===================
    flow.append(Paragraph("1.  Detailed findings", s["GtsH1"]))
    flow.append(Paragraph("1.1  Dark-web exposure inventory", s["GtsH2"]))
    flow.append(Paragraph(
        "Across continuous-monitoring sweeps, the following data points belonging to the customer were identified on "
        "credentialed dark-web indexes. Each finding has been hashed, time-stamped, and entered into our case file under "
        f"incident <b>{incident_id}</b>.",
        s["GtsBody"]
    ))

    findings = [
        ["#", "Asset exposed", "Source", "Severity", "Status"],
        ["1", "Full legal name + DOB", "Foreign-hosted aggregator", "Medium", "Contained"],
        ["2", "Social Security Number (SSN)", "Underground PII bundle", "Critical", "SSA Notified"],
        ["3", "Home address (current + prior)", "Cross-listed broker dump", "Medium", "Contained"],
        ["4", "Bank routing details", "Carded-list marketplace", "High", "Bureaus Frozen"],
        ["5", "AOL email + reused password hash", "Combo-list paste site", "High", "Forced rotation"],
        ["6", "Device fingerprints (3 hosts)", "Compromised tracker beacon", "Medium", "Hardened"],
    ]
    table = Table(findings, colWidths=[0.3 * inch, 2.0 * inch, 1.85 * inch, 1.0 * inch, 1.25 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("TEXTCOLOR", (0, 1), (-1, -1), SLATE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, SLATE_100]),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BACKGROUND", (3, 2), (3, 2), RED_LIGHT),  # SSN critical
        ("TEXTCOLOR", (3, 2), (3, 2), RED),
        ("FONTNAME", (3, 2), (3, 2), "Helvetica-Bold"),
        ("BACKGROUND", (3, 4), (3, 5), AMBER_LIGHT),
        ("TEXTCOLOR", (3, 4), (3, 5), AMBER),
        ("FONTNAME", (3, 4), (3, 5), "Helvetica-Bold"),
        ("BACKGROUND", (4, 1), (4, -1), GREEN_LIGHT),
        ("TEXTCOLOR", (4, 1), (4, -1), GREEN),
    ]))
    flow.append(table)
    flow.append(Spacer(1, 0.18 * inch))

    flow.append(Paragraph("1.2  Threat propagation", s["GtsH2"]))
    flow.append(Paragraph(
        "Figure 1 below illustrates how the customer's data moved from the original foreign compromised host into "
        "downstream dark-web markets, and how Global Tech Solutions intercepted, contained, and remediated each layer.",
        s["GtsBody"]
    ))
    flow.append(ThreatFlowDiagram())
    flow.append(PageBreak())

    # =================== PAGE 3 — REMEDIATION ACTIONS ===================
    flow.append(Paragraph("2.  Remediation actions taken", s["GtsH1"]))
    flow.append(Paragraph(
        "Each of the following actions was completed by Global Tech Solutions on the customer's behalf. All actions are "
        "documented, time-stamped, and signed off by the lead technician below. No further action is required from the "
        "customer at this time.",
        s["GtsBody"]
    ))

    actions = [
        ["✓", "Hostile server destroyed",
         "The foreign-hosted command-and-control server confirmed as the propagation source was traced via Microsoft "
         "telemetry and rendered inoperable through coordinated takedown channels. Logs preserved for chain-of-custody."],
        ["✓", "Federal & state authorities notified",
         "FBI IC3 complaint filed; FTC IdentityTheft.gov report logged; New Jersey State Police cybercrime unit alerted. "
         "Reference numbers retained on file."],
        ["✓", "Credit bureaus contacted",
         "Formal fraud alerts and credit freezes were initiated with Equifax, Experian, and TransUnion. Free 90-day "
         "fraud-alert renewals are queued automatically."],
        ["✓", "Social Security Administration notified",
         "SSA fraud unit informed of SSN exposure. Trusted-contact flag added to the customer's record so any "
         "unauthorized benefit-redirect attempt is blocked at intake."],
        ["✓", "IP address encrypted & masked",
         "Customer egress migrated onto an AES-256 always-on tunnel terminating at a Microsoft-provisioned dedicated "
         "node. The customer's true public IP is no longer visible to any external observer."],
        ["✓", "Endpoint security re-installed across all 10 devices",
         "Managed EDR, host firewall, browser-level phishing protection, and DNS-layer filtering deployed across the "
         "customer's entire VIP device fleet (10 devices, transferable). Initial baseline scan: clean."],
        ["✓", "Microsoft-provisioned dedicated security node",
         "A dedicated infrastructure node was provisioned directly through Microsoft for the customer's VIP account. "
         "The node masks the customer's IP for a full 12-month tenure and provides a sustained 1.5 Gbps of inspected "
         "bandwidth — fast enough that latency-based brute-force and slow-loris attacks become non-viable."],
        ["✓", "Continuous dark-web monitoring re-baselined",
         "All compromised identifiers (email, SSN, routing, addresses) are now under 24/7 continuous monitoring with "
         "instant alerting to the lead technician. New listings trigger an automated freeze workflow."],
    ]
    rows = [["", "Action", "Detail"]]
    for a in actions:
        rows.append([
            Paragraph(f'<font color="#15803d"><b>{a[0]}</b></font>', s["GtsBody"]),
            Paragraph(f"<b>{a[1]}</b>", s["GtsBody"]),
            Paragraph(a[2], s["GtsBody"]),
        ])
    action_table = Table(rows, colWidths=[0.3 * inch, 1.8 * inch, 4.3 * inch])
    action_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, SLATE_100]),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
    ]))
    flow.append(action_table)
    flow.append(PageBreak())

    # =================== PAGE 4 — MICROSOFT NODE ARCHITECTURE ===================
    flow.append(Paragraph("3.  Microsoft-provisioned dedicated security node", s["GtsH1"]))
    flow.append(Paragraph(
        "Going forward, every byte of the customer's network traffic — across all ten covered devices — is routed "
        "through a dedicated Microsoft-provisioned security node. The customer's true public IP address is fully "
        "masked for the duration of the 12-month VIP tenure, and the node sustains a guaranteed 1.5 Gbps of inspected "
        "bandwidth. The high throughput is a deliberate defensive choice: the most common targeted-attack patterns "
        "(slow-loris, low-and-slow brute force, and bandwidth-starvation phishing redirects) all rely on a constrained "
        "victim link to succeed. By keeping the customer's pipe wide, fast, and inspected, those classes of attack are "
        "structurally non-viable.",
        s["GtsBody"]
    ))
    flow.append(SecureNodeDiagram())
    flow.append(Spacer(1, 0.1 * inch))

    flow.append(Paragraph("3.1  What this means in plain English", s["GtsH2"]))
    flow.append(Paragraph(
        "• Hackers can no longer see where you are connecting from — your home and prior addresses, your real IP, and "
        "your device fingerprints are hidden behind a Microsoft-grade tunnel.", s["GtsBullet"]
    ))
    flow.append(Paragraph(
        "• Every site you visit — bank, email, crypto exchanges, government portals — sees a clean Microsoft egress "
        "address rotated on a schedule, never your home.", s["GtsBullet"]
    ))
    flow.append(Paragraph(
        "• If a previously-leaked credential is re-used against you, the attempt is blocked at the node before it "
        "reaches your devices, and the lead technician receives an alert in real time.", s["GtsBullet"]
    ))
    flow.append(Paragraph(
        "• You are not asked to install or configure anything. The protection is a managed service that renews silently "
        "for the 12-month tenure.", s["GtsBullet"]
    ))

    flow.append(Spacer(1, 0.08 * inch))
    flow.append(Paragraph("4.  Recommendations & next review", s["GtsH1"]))
    flow.append(Paragraph(
        "No customer action is required. We will conduct a quarterly VIP health-check (already booked on your dashboard) "
        "and notify you immediately if any new dark-web listing matches your identifiers. Your lead technician remains "
        "your single point of contact 24/7 on the dedicated VIP support line.",
        s["GtsBody"]
    ))

    # Sign-off block (kept together so it never orphans)
    signoff = Table([
        [Paragraph("<b>Prepared &amp; signed off by</b>", s["Callout"]), ""],
        [Paragraph(f"<b>{technician_name}</b><br/><font color='#64748b' size='9'>{technician_cert}</font><br/><font color='#64748b' size='9'>Lead Technician — Global Tech Solutions</font>", s["GtsBody"]),
         Paragraph(f"<b>Date issued</b><br/><font color='#64748b' size='9'>{issue_date}</font><br/><font color='#64748b' size='9'>Incident: {incident_id}</font>", s["GtsBody"])],
    ], colWidths=[3.2 * inch, 3.2 * inch])
    signoff.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SLATE_100),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    flow.append(KeepTogether(signoff))

    doc.build(flow, onFirstPage=_draw_header_footer, onLaterPages=_draw_header_footer)
    return output_path
