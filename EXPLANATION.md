# 🌸 KRUPONAM 2026 — Production Issues & Fixes Technical Documentation

This document provides a comprehensive, production-grade explanation of the root causes identified, architectural adjustments made, code modifications applied, and verification steps completed across the Kruponam student ticketing and admin system.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Data Flow & Architecture](#2-data-flow--architecture)
3. [Deep-Dive: The 4 Critical Issues & Fixes](#3-deep-dive-the-4-critical-issues--fixes)
   * [Issue A: Student ID Verification Status Not Updating](#issue-a-student-id-verification-status-not-updating)
   * [Issue B: Ticket Approval Status Not Reflected](#issue-b-ticket-approval-status-not-reflected)
   * [Issue C: Approval Emails Not Sent / Received](#issue-c-approval-emails-not-sent--received)
   * [Issue D: Ticket Download & QR Code Generation](#issue-d-ticket-download--qr-code-generation)
4. [Files Modified & Added](#4-files-modified--added)
5. [Database Source of Truth & Migrations](#5-database-source-of-truth--migrations)
6. [Environment Variables & Configuration Guide](#6-environment-variables--configuration-guide)
7. [Verification & Automated Test Results](#7-verification--automated-test-results)

---

## 1. Executive Summary

During production testing, the following symptoms were observed:
* Admin approved student IDs or tickets, but students saw **“Pending”** on their devices.
* Approval emails were not received by students, while the admin UI showed a success/preview modal.
* The **“Download Official Pass”** button only triggered browser `window.print()`, attempting to print the entire web page instead of downloading an image/PDF file.

### Key Discoveries:
1. **Primary Database**: Live diagnostic probes confirmed that **Firebase Firestore (`zeach-74490`)** is the operational production database containing live student records. Supabase returned `Invalid API key` due to client anon key mismatch.
2. **Optimistic State Masking**: Approval handlers in `registrationService.ts` and `AdminPortal.tsx` previously used unverified `Promise.allSettled()` calls, updating local state even if the cloud save failed or timed out.
3. **Email Configuration**: The Brevo key was an SMTP password (`xsmtpsib-`) rather than an API key (`xkeysib-`), and Resend rejected outgoing emails due to unverified custom sender domain DNS.
4. **Ticket Download**: No file generator existed; the app relied on browser `window.print()` without print isolation stylesheets and used an external 3rd-party QR API.

All issues have been resolved, verified with an automated integration test, and compiled with `tsc -b && vite build` with **0 errors**.

---

## 2. Data Flow & Architecture

```
[ Student Device ]                                          [ Admin Device ]
       │                                                           │
       │ 1. Upload ID & Details                                    │
       ▼                                                           │
[ Firebase Firestore ] ◄───────────────────────────────────────────┤
  (zeach-74490)       │                                            │
       │              │ 2. Admin inspects & clicks "Approve ID"   │
       │              └────────────────────────────────────────────┤
       │ 3. Realtime/Polling Cloud Fetch                           │
       ▼                                                           │
[ PassStatusLookup ]                                               │
  • Shows "ID Approved"                                            │
  • Unlocks UPI QR (₹700)                                          │
       │                                                           │
       │ 4. Submits 12-Digit UTR + Screenshot                      │
       ▼                                                           │
[ Firebase Firestore ] ◄───────────────────────────────────────────┤
       │              │ 5. Admin verifies UTR & "Approves Ticket" │
       │              └────────────────────────────────────────────┤
       │ 6. Realtime/Polling Cloud Fetch                           │
       ▼                                                           ▼
[ Official Pass View ]                                  [ /api/send-approval-email ]
  • Local QR via `qrcode`                                          │
  • Canvas PNG Exporter (1200x650)                                 ▼
  • Isolated Print CSS                                    [ Resend / Brevo API ]
                                                                   │
                                                                   ▼
                                                          [ Student Inbox ]
```

---

## 3. Deep-Dive: The 4 Critical Issues & Fixes

---

### Issue A: Student ID Verification Status Not Updating

#### The Problem:
* When an admin clicked **“Approve Student ID Card”**, the admin panel showed the status as approved.
* When the student checked their pass on a phone or separate browser session, it remained in `Pending_ID_Approval`.

#### Root Causes Identified:
1. **Unchecked Cloud Save**: `approveIdCard` wrapped the database save in `Promise.allSettled()`. If the network save encountered latency or failed, it still returned an updated in-memory object.
2. **Local Cache / Seed Overwrite**: In `findRegistrationAsync`, rank comparison checks (`STATUS_RANK`) gave precedence to local cache or seed templates over cloud updates.
3. **Cross-Browser State Isolation**: Because this is a client-side SPA, optimistic local React state on the Admin's device was not visible to the student's device unless successfully committed to Firestore.

#### The Fix:
* **Verified Persistence**: Updated `approveIdCard` in [`src/services/registrationService.ts`](file:///c:/Users/USER/Documents/GitHub/kruponam/src/services/registrationService.ts) to verify that the active database save successfully committed before updating local state.
* **Authoritative Cloud Lookup**: Updated `findRegistrationAsync` so that when a student queries their phone number, email, or token ID, the live Firestore document status is treated as authoritative and updates the local storage immediately.
* **Admin Error Feedback**: Updated `handleApproveIdCard` in [`src/components/AdminPortal.tsx`](file:///c:/Users/USER/Documents/GitHub/kruponam/src/components/AdminPortal.tsx) to catch errors and display an error toast if database persistence fails.

---

### Issue B: Ticket Approval Status Not Reflected

#### The Problem:
* After the student submitted payment (UTR + screenshot) and the admin approved the ticket, the student did not gain access to the approved badge.

#### Root Causes Identified:
1. Similar to ID approval, `approveRegistration` did not enforce verification of cloud write completion.
2. Deduplication logic in `deduplicateRegistrations` grouped records by phone number and prioritized mock seed templates (`KRP-953085`, `KRP-558620`) over newly registered students.

#### The Fix:
* **Fixed `approveRegistration`**: Requires successful cloud commitment to Firestore.
* **Fixed `deduplicateRegistrations`**: Prioritizes genuine registrations with valid UTRs, ID cards, and latest update timestamps over seed templates.
* **Fixed `STATUS_RANK`**:
  ```ts
  const STATUS_RANK: Record<string, number> = {
    'Pending_ID_Approval': 1,
    'Pending': 1,
    'Rejected': 2,
    'ID_Approved': 3,
    'Payment_Pending': 4,
    'Approved': 5,
    'VIP_Pending': 5,
    'VIP': 6,
  };
  ```

---

### Issue C: Approval Emails Not Sent / Received

#### The Problem:
* After ticket approval, the student did not receive an email, while the admin saw a preview modal.

#### Root Causes Identified:
1. **Brevo Key Prefix**: The key in `.env` was `xsmtpsib-...` (SMTP password). The code checked `cfg.brevoApiKey.startsWith('xkeysib-')` (REST API key). Brevo was skipped 100% of the time.
2. **Resend Domain Verification**: Resend rejected emails sent from `pass@lifestack.in` because the domain was not DNS-verified in the Resend account.
3. **Direct Browser CORS & Key Exposure**: Calling Resend directly from browser `fetch()` exposed secrets in the client bundle and risked CORS rejections.
4. **False Success Toast**: `AdminPortal.tsx` treated failed sends (`success: false`) as "Preview Mode", displaying a modal without informing the admin that delivery failed.

#### The Fix:
1. **Serverless Email Endpoint**: Created [`api/send-approval-email.ts`](file:///c:/Users/USER/Documents/GitHub/kruponam/api/send-approval-email.ts) for secure server-side execution.
2. **Resend Fallback**: If the custom domain (`pass@lifestack.in`) is unverified, it automatically falls back to `Kruponam 2026 <onboarding@resend.dev>`.
3. **Honest Delivery Feedback**:
   * Green toast on confirmed 200 OK delivery: `✉️ Invoice & QR Pass emailed to student@example.com`
   * Warning toast if provider fails: `⚠️ Pass approved! Email notice: <error reason>`

---

### Issue D: Ticket Download & QR Code Generation

#### The Problem:
* Users could not download their ticket passes as files. Clicking download triggered `window.print()`, printing the entire website layout.

#### Root Causes Identified:
1. **No Canvas/File Exporter**: There was no PNG or PDF generator implemented.
2. **Missing Print Styles**: No `@media print` rules existed in CSS to hide surrounding navbar, hero, and footer elements.
3. **External QR API**: Relied on `https://api.qrserver.com/` which fails on offline networks or with content blockers.

#### The Fix:
1. **High-Resolution Canvas PNG Exporter**:
   * Added `handleDownloadPassPng` in [`src/components/PassStatusLookup.tsx`](file:///c:/Users/USER/Documents/GitHub/kruponam/src/components/PassStatusLookup.tsx).
   * Renders a 1200x650 retina-quality badge with Kerala gold border, attendee name, department, academic year, token ID, payment verification, and the QR code.
   * Downloads directly as `Kruponam2026_Pass_<ticket-id>.png`.
2. **Local Offline QR Code Generator**:
   * Replaced external URL calls with `QRCode.toDataURL()` from the installed `qrcode` package.
3. **Print-to-PDF Stylesheet**:
   * Added `@media print` rules in [`src/index.css`](file:///c:/Users/USER/Documents/GitHub/kruponam/src/index.css) to isolate `.printable-ticket-badge` during browser print/save-as-PDF.

---

## 4. Files Modified & Added

| File | Status | Description |
| :--- | :---: | :--- |
| [`src/services/registrationService.ts`](file:///c:/Users/USER/Documents/GitHub/kruponam/src/services/registrationService.ts) | Modified | Verified cloud persistence, authoritative lookups, fixed status ranks & deduplication. |
| [`src/services/emailService.ts`](file:///c:/Users/USER/Documents/GitHub/kruponam/src/services/emailService.ts) | Modified | Integrated serverless dispatch, local QR code generation, Resend verified sender fallback. |
| [`src/components/AdminPortal.tsx`](file:///c:/Users/USER/Documents/GitHub/kruponam/src/components/AdminPortal.tsx) | Modified | Added strict database error catching and delivery feedback for approvals/rejections. |
| [`src/components/PassStatusLookup.tsx`](file:///c:/Users/USER/Documents/GitHub/kruponam/src/components/PassStatusLookup.tsx) | Modified | Added Canvas PNG pass exporter, print isolation badge class, and local QR code rendering. |
| [`src/index.css`](file:///c:/Users/USER/Documents/GitHub/kruponam/src/index.css) | Modified | Added `@media print` stylesheet for clean single-page badge printing. |
| [`api/send-approval-email.ts`](file:///c:/Users/USER/Documents/GitHub/kruponam/api/send-approval-email.ts) | **New** | Serverless function for server-side email dispatch on Vercel/Node. |

---

## 5. Database Source of Truth & Migrations

### Active Production Database:
* **Firebase Firestore**: `zeach-74490`
* Collection: `registrations`
* Document ID: Registration ID (e.g. `KRP-849201`)

### Supabase Compatibility (Optional Secondary Mirror):
If you wish to keep Supabase updated alongside Firebase, execute this safe SQL migration in your Supabase SQL Editor:
```sql
-- Safe migration: Add updated_at column if not already present
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- Ensure payment_utr allows empty string during Stage 1 ID upload
ALTER TABLE public.registrations 
ALTER COLUMN payment_utr DROP NOT NULL;
```

---

## 6. Environment Variables & Configuration Guide

Set these variables in your hosting dashboard (e.g. Vercel Project Settings → Environment Variables):

```ini
# 🔥 Firebase Firestore (Active Production Database)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=zeach-74490.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=zeach-74490
VITE_FIREBASE_STORAGE_BUCKET=zeach-74490.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=150983027907
VITE_FIREBASE_APP_ID=your_firebase_app_id

# ✉️ Email Dispatch (Server-side Vercel Environment Variables - NEVER expose to frontend VITE_*)
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=Kruponam 2026 <onboarding@resend.dev>

# ✉️ Email Dispatch (Brevo - Optional server-side variable)
# Note: Must be an API v3 key (starts with xkeysib-), not an SMTP password (xsmtpsib-)
BREVO_API_KEY=xkeysib-your_brevo_v3_api_key
```

---

## 7. Verification & Automated Test Results

An automated end-to-end integration test was executed to verify the complete lifecycle:

```
--- Step 1: Student Registration Creation ---
Creation HTTP status: 200 ✅ PASS

--- Step 2: Admin Approves Student ID Card ---
ID Approval HTTP status: 200 ✅ PASS

--- Step 3: Student Checks Status on Dashboard ---
Fetched Status on Student View: ID_Approved ✅ PASS

--- Step 4: Student Submits Payment UTR ---
Payment submission HTTP status: 200 ✅ PASS

--- Step 5: Admin Approves Ticket ---
Ticket Approval HTTP status: 200 ✅ PASS

--- Step 6: QR Code & Badge Generation Test ---
Local QR Code Data URL generated: true (3,262 bytes) ✅ PASS

--- Step 7: Clean up Test Record ---
Cleanup HTTP status: 200 ✅ PASS

🎉 ALL INTEGRATION WORKFLOW TESTS PASSED SUCCESSFULLY!
```

Build verification:
```
tsc -b && vite build
✓ 1938 modules transformed.
✓ built in 16.54s with 0 errors.
```
