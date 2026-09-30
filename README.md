# TRUSTDRILL™ — AI-Powered Offset-Well Intelligence & Predictive Drilling Risk Platform

> **eRTMAC–NWIS | Smart India Hackathon 2026 (Problem Statement ID: SIH26121)**  
> **Target Enterprise Operator:** Oil India Limited (OIL)  
> *“KNOW WHAT HAPPENED. PREDICT WHAT’S NEXT.”*  
> *Advisory Decision Support — Not Autonomous Drilling Control.*

---

## 🎯 Executive Overview

**TRUSTDRILL™** is a Digital Intelligence Command Center engineered for **Oil India Limited (OIL)** and the **Smart India Hackathon 2026**. It solves the critical industrial challenge of drilling non-productive time (NPT), induced lost circulation, differential pipe sticking, and unexpected well control incidents in high-risk reservoir intervals (such as the Barail Sandstone and Kopili/Disang transitions in the Upper Assam Shelf).

TrustDrill ingests historical Well Completion Reports (WCR), Daily Drilling Reports (DDR), and mud logs via OCR and Natural Language Processing, correlates them spatially with active well trajectories using PostGIS multi-well ranking, and combines real-time eRTMAC/WITSML rig telemetry with predictive risk models to deliver explainable, evidence-backed hazard advisories with actionable lead time.

---

## 🏗️ Architecture & Continuous Knowledge Pipeline

```
ACTIVE WELL (TRUST-01)
      ↓  (eRTMAC / WITSML 2.0 Live Telemetry)
NEARBY OFFSET WELLS
      ↓  (PostGIS Spatial Radius & Geological Dip Correlation)
HISTORICAL KNOWLEDGE
      ↓  (LayoutLMv3 OCR + NER Ingestion of WCR / DDR Reports)
AI CORRELATION
      ↓  (Stratigraphic Multi-Vector Formation Matching @ Bit Depth)
RISK INTELLIGENCE & ADVISORY
         (IEC 62682 Industrial Hazard Alerts, Staged LCM Pills, Engineering Evidence Dossier)
```

---

## 🚀 Key Platform Features

1. **Digital Intelligence Command Center (70/30 Split)**:
   - **70% Interactive Spatial Map**: Concentric distance rings (1km, 2km, 3km, 5km), active well coordinate HUD (`27°18'44.2"N 95°19'12.8"E`), fault strike lines, and historical hazard polygons.
   - **30% Live Risk Intelligence Panel**: Clear industrial warning hierarchy with bit stratigraphy column, dynamic proximity countdown, and pre-entry SOP checklist.
2. **Offset Well Intelligence Slide-Over Drawer**:
   - Deep-dive into offset analogs (`OIL-NHK-142`, `OIL-DIG-88`, `OIL-KDM-09`, `OIL-DGB-104`, `OIL-NHK-119`) with similarity breakdown, incident logs, and source document citations.
3. **Historical Evidence Pack & Audit Trail**:
   - Scanned-look Oil India Limited archive viewer with WCR, DDR Tour Sheets, Composite Mud Logs, OCR verification badge (98.6%), and engineering sign-offs.
4. **Engineering Analytics Suite**:
   - Depth-synchronized telemetry curves: Depth vs ROP, Depth vs Torque (with 35 kNm hazard limit), Depth vs WOB, and Mud Weight vs Depth plotted inside the safe Pore Pressure & Fracture Gradient drilling margin.
5. **TRUSTDRILL Copilot (AI Knowledge Base)**:
   - Natural language drilling assistant with structured responses visually separated into **Insight**, **Quantitative Evidence**, **Source Wells**, and **Source Documents**.
6. **SIH Signature 11-Step Guided Demo Flow**:
   - Interactive, step-by-step presentation controller tailored for SIH judges.
7. **High-Contrast Presentation Mode**:
   - Full-screen projector-optimized display mode.
8. **Global Search (`Ctrl+K`)**:
   - Command palette with instant search across wells, formations, incidents, reports, and commands.

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### Installation & Run
```bash
# 1. Clone repository
git clone https://github.com/<your-username>/trustdrill.git
cd trustdrill

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

### Build for Production
```bash
npm run build
npm run preview
```

---

## 🌐 Deploying to GitHub Pages (Automated via GitHub Actions)

This repository includes a pre-configured automated GitHub Actions workflow (`.github/workflows/deploy.yml`).

1. Push this repository to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Initial TRUSTDRILL commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/trustdrill.git
   git push -u origin main
   ```
2. In your GitHub repository:
   - Navigate to **Settings** → **Pages** (under Code and automation).
   - Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. Within 60 seconds, GitHub Actions will automatically compile and publish your site to:
   ```
   https://<your-username>.github.io/trustdrill/
   ```

---

## 🏛️ Governance & Compliance

- **Decision Support Boundary**: Designed strictly as an advisory decision support layer. Qualified drilling personnel and rig superintendents retain full operational control.
- **Alarm Standard**: Ergonomics follow **IEC 62682** (Management of Alarm Systems for the Process Industries).
- **Security & Stream Protocols**: Compatible with **WITSML 2.0 / ETP** over TLS 1.3 enterprise encryption.

---

## 👥 Authors & Team
- **Smart India Hackathon 2026**
- **Problem Statement ID:** SIH26121
- **Organization:** Oil India Limited (OIL) / Ministry of Petroleum & Natural Gas
