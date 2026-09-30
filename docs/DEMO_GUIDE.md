# TrustDrill — 5–10 Minute SIH Demonstration Guide

> **Project**: eRTMAC-NWIS (Nearby Wells Intelligence System)  
> **Problem Statement**: SIH 26121 — AI-Powered Offset Well, Document & Risk Correlation Engine

---

## Demonstration Overview & Objective

This guide outlines a crisp, 5 to 10 minute live technical walkthrough designed for evaluators, faculty, and industry judges. It demonstrates the complete end-to-end chain:

$$\text{Problem} \longrightarrow \text{Centralized Well Data} \longrightarrow \text{Document Intelligence} \longrightarrow \text{Geospatial Offset Analysis} \longrightarrow \text{Explainable Risk Intelligence} \longrightarrow \text{Audit-Ready Report}$$

---

## Step-by-Step Walkthrough

### Step 1: Login & Operations Dashboard (1 minute)
1. Navigate to `http://localhost:3000` (or `http://localhost:3000/login`).
2. Log in using pre-seeded engineer credentials:
   - **Email**: `engineer@trustdrill.local`
   - **Password**: `demo1234`
3. Point out the **Operations Dashboard**:
   - Live KPI ribbon: Active MD, Bit Depth, ROP, Torque, Flow In/Out balance, and Active Pit Volume.
   - Nearest Offset Well card with distance callout.
   - Real-time ROP vs Depth trend chart.
   - Notice the transparent synthetic provenance banner: *"Prototype decision support only. Simulated telemetry and fictional wells."*

---

### Step 2: Geospatial Offset Well Explorer (1.5 minutes)
1. Click **Map** in the navigation bar (`/map`).
2. Select target well **SYN-WELL-A01 (Dibrugarh Alpha 1)**.
3. Adjust the **Search Radius Slider** (e.g. from `5 km` to `10 km` and `25 km`):
   - Highlight the interactive PostGIS spatial buffer updating in real-time.
   - Offset well markers dynamically filter and display risk status colors (Teal = Low, Amber = Medium, Rose = High).
4. Click on an offset well marker (e.g., **SYN-WELL-A03**):
   - Review popup details: Distance ($6.2\text{ km}$), Total Depth ($1420\text{ m}$), and recorded incident history.

---

### Step 3: Well Intelligence Technical Profile (1.5 minutes)
1. Click on **Wells** (`/wells`) and open **SYN-WELL-A01**.
2. Walk through the integrated technical tabs:
   - **Overview & Geometry**: Surface coordinates, MD vs TVD directional survey profile, and survey inclination table.
   - **Formations**: Stratigraphic tops and thickness column (e.g. `SYN-FM-ALPHA`, `SYN-FM-BRAVO`).
   - **Events & History**: Historical incident log with NPT duration, mitigation steps, and lessons learned.
   - **Correlation & Risk**: Integrated offset comparison showing comparable wells ranking and hazard indicators.

---

### Step 4: AI Document Intelligence & OCR Extraction (2 minutes)
1. Navigate to **Documents** (`/documents`).
2. Demonstrate an existing uploaded report or upload a sample document from `backend/sample_docs/`:
   - Click on `SYN-WELL-A03_loss_event.txt` or `SYN-WELL-A07_kick_incident.txt`.
3. Highlight the **Grounded AI Extraction**:
   - Notice that extracted facts are grouped into *Well Info*, *Drilling Info*, and *Operational Incidents*.
   - Point out that **every single fact** is cited with its exact **Page Number** and **Evidence Snippet**.
   - Show that missing parameters remain explicit `null` values (verifying zero hallucination / non-invention).
4. Click **Approve & Publish to Wells** to demonstrate the Human-in-the-Loop review workflow.

---

### Step 5: Multi-Factor Correlation & Hazard Trends (1.5 minutes)
1. Navigate to **Correlation** (`/correlation`).
2. Select target well **SYN-WELL-A01** with radius `25 km`.
3. Review the **Ranked Comparable Wells**:
   - Show the transparent similarity breakdown:
     - Distance ($35\%$)
     - Formation overlap ($25\%$)
     - Depth similarity ($20\%$)
     - Field ($10\%$) & Basin ($10\%$)
4. Scroll down to the **Historical Hazard Distribution Charts**:
   - Event frequency by Depth Interval ($2000\text{--}2500\text{ m}$, $2500\text{--}3000\text{ m}$, etc.).
   - Event frequency by Geological Formation.
   - Event frequency by Hazard Type.

---

### Step 6: Explainable Risk Intelligence & Audit Report (1.5 minutes)
1. Navigate to **Risk** (`/risk`).
2. Select **SYN-WELL-A01** (Radius: `25 km`):
   - Highlight the separate hazard indicator cards: **Lost Circulation**, **Stuck Pipe**, **Well Control / Influx**, and **Hole Instability**.
   - Emphasize to the judges: **Zero fake percentage probabilities are manufactured.**
   - Show the empirical occurrence metrics (e.g., *"3 of 8 comparable wells (38%)"*), depth overlap, and formation interval matches.
3. Expand the **Supporting Evidence Drilldown**:
   - Show the exact supporting offset wells (e.g., `SYN-WELL-A03 — 6.2 km`, `SYN-WELL-A05 — 8.4 km`).
   - Show the clickable document citations (e.g., `WCR_Offset_Report.pdf — Page 43`).
4. Click **Export Report (PDF/CSV)** (`/reports`):
   - Click **Export Risk PDF** to generate the official 9-section `TrustDrill Risk Intelligence Report`.
   - Open the PDF to showcase the formatted technical profile, comparable wells table, explainable hazard indicators, and engineering disclaimers.

---

## Key Talking Points for Evaluators

1. **Explainable by Design**: Risk indicators provide traceable reasons, contributing offset wells, and page citations rather than opaque black-box AI scores.
2. **Grounded Provenance**: Extracted technical parameters cite source documents, page numbers, and exact sentence snippets.
3. **Deterministic Numerical Logic**: Spatial queries, depth overlap, and similarity weightings use deterministic mathematics, reserving AI strictly for natural language synthesis and document extraction.
4. **Resilient Architecture**: Built on PostgreSQL/PostGIS, FastAPI, and Next.js 14 with role-based access control and strict data validation.
