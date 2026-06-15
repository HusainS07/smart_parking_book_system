# 🅿️ Smart Parking Booking System

A comprehensive, production-hardened Next.js-based parking booking platform. Users can search for locations, book parking slots with real-time status updates, top up their digital wallets, and complete transactions. Administrators can manage parking lot requests, approve new locations, and verify user top-up requests.

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🛠️ Technology Stack](#️-technology-stack)
- [🔒 Security & Hardening (Recent Audits)](#-security--hardening-recent-audits)
- [📁 Project Structure](#-project-structure)
- [🚀 Installation & Setup](#-installation--setup)
- [📡 API Endpoints](#-api-endpoints)
- [💡 Usage](#-usage)

---

## ✨ Features

- **User Authentication:** NextAuth.js integration featuring Credentials, Google, and GitHub social login.
- **Role-Based Access Control:** Secure admin dashboard for approving pending lots and validating wallet top-up requests.
- **ACID Transaction Booking:** Transaction-safe booking flow using PostgreSQL to prevent race conditions or double bookings.
- **Optimized Caching:** Client-side caching for user profile tabs to eliminate redundant network queries and minimize loading delays.
- **Wallet Integration:** Digital wallet for instantaneous slot booking, with administrative approval workflow for manual top-ups.
- **RAG Support Bot:** Integrated AI helper powered by a Retrieval-Augmented Generation (RAG) microservice to answer user questions on rules and FAQs.
- **Edge-Level Rate Limiting:** Credentials login is protected at the CDN Edge layer, blocking brute-force attacks before invoking serverless compute.

---

## 🛠️ Technology Stack

- **Frontend & Routing:** Next.js (App Router), React, CSS Variables (Clean Custom UI)
- **Backend:** Next.js Route Handlers (Serverless API design)
- **Database:** PostgreSQL (Supabase) via `node-postgres` (`pg`) with raw parameterized SQL queries
- **Distributed Rate Limiting:** Upstash Redis (REST-based serverless Redis client)
- **Payment Gateway:** Razorpay API for digital transactions
- **Authentication:** NextAuth.js (JWT session strategy, HttpOnly Cookies)

---

## 🔒 Security & Hardening (Recent Audits)

The system was audited and hardened against the OWASP top vulnerabilities. Notable protections include:

- **SQL Injection Prevention:** 100% parameterized queries using Postgres placeholders (`$1, $2`). No raw query string interpolation.
- **Edge Brute-Force Protection:** Intercepts brute-force credential scans at Vercel's Edge (`middleware.js`) using Upstash Redis. Limit: 10 attempts per 15 minutes per IP.
- **IDOR Safeguards:** Strict validation on all user paths (e.g. `GET/PUT /api/user/[email]` and `/api/bookings/[email]`) ensuring users can only read/edit their own profiles.
- **No Password Leaks:** Cleaned up data serializations; password hashes are completely stripped from API responses.
- **Secure Dashboard Access:** Admin endpoints (`/api/admin/*`) require an active session containing an `'admin'` role flag.
- **HTTP Security Headers:** Added robust security headers in `next.config.mjs` including `X-Frame-Options` (Clickjacking protection) and a strict `Content-Security-Policy` (CSP).
- **RAG Token Exhaustion Mitigation:** Limits user inquiries in the support bot to a maximum of 300 characters and rate-limits queries (5 queries per 15 minutes per IP).

---

## 📁 Project Structure

```
├── app/
│   ├── admin_page/             # Admin management dashboard
│   ├── book/                   # Parking slots booking interface
│   ├── help/                   # Help & RAG Support Bot interface
│   ├── profile/                # Profile management page & client cache
│   ├── wallet/                 # Wallet management & topup requests
│   └── api/                    # Serverless Next.js API Routes
│       ├── admin/              # Admin-specific controllers (approve/reject lots, topups)
│       ├── auth/               # NextAuth setup and provider configs
│       ├── bookings/           # Fetch bookings (IDOR-safe)
│       ├── contact/            # Support form + RAG microservice connector (300 char cap)
│       ├── slots/              # Get location slots & place bookings
│       ├── user/               # Fetch and update profiles (IDOR-safe, no hash exposure)
│       └── wallet/             # Wallet actions (deduct/topup request)
├── lib/
│   ├── db.js                   # PostgreSQL client connection pool
│   └── ratelimiter.js          # Upstash Redis rate-limiting provider
├── middleware.js               # Edge-layer login rate limiter
├── next.config.mjs             # Next.js configurations & security headers
├── package.json                # Project dependencies & security overrides
└── clear-queue.mjs             # Utility to clean up expired transaction locks
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database instance (e.g. Supabase)
- Upstash Redis account (for rate-limiting keys)
- Razorpay account developer credentials

### Step 1: Clone and Install Dependencies
```bash
git clone <repository-url>
cd smart_parking_book_system
npm install
```

### Step 2: Environment Configuration
Create a `.env.local` file in the root folder:

```env
# Database
DATABASE_URL=postgres://postgres.yourdburl.supabase.co:6543/postgres?sslmode=require

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_jwt_signing_secret_here
NEXTAUTH_URL=http://localhost:3000

# Upstash Redis (Serverless Edge Rate Limiting)
UPSTASH_REDIS_REST_URL=https://your-upstash-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token_here

# Razorpay Integration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_SECRET_KEY=your_razorpay_secret_key
```

### Step 3: Run Development Server
```bash
npm run dev
```

Open `http://localhost:3000` to access the application.

---

## 📡 API Endpoints

### 🔐 Authentication
- `POST /api/auth/callback/credentials` - Login callback (Edge rate-limited: 10/15min)
- `POST /api/register` - User registration (Rate-limited: 5/10min)

### 🚗 Bookings & Slots
- `GET /api/slots?location=<city>` - Browse approved slots in a city
- `POST /api/slots/book` - Confirms a slot booking (Database transaction locked)
- `GET /api/bookings/[email]` - Returns bookings list (ownership checked)

### 💳 Wallet & Balance
- `GET /api/wallet/amount` - Fetches current balance
- `POST /api/wallet/topup` - Files a pending topup request for admin approval
- `POST /api/wallet/deduct` - Deducts wallet balance (used during slot bookings)

### 🛠️ Admin Dashboard (`role === 'admin'`)
- `GET /api/admin/lots/pending` - Fetch unapproved lots
- `POST /api/admin/lots/approve` - Approve lot and generate slot IDs
- `GET /api/admin/topup-requests` - View pending balance updates
- `PUT /api/admin/topup-requests` - Approve/Reject top-up credits
---

## 💡 Usage

1. **Top-Up Wallet:** Go to the Wallet page, specify your name and target amount, and send a top-up request. Access your PostgreSQL database directly to elevate your user account to an `'admin'` role, then approve the request in the admin panel to credit the wallet balance.
2. **Register/Approve Lot:** Register a parking lot in your dashboard profile page. Log in as an administrator to approve it. Approving automatically generates individual parking slots based on the lot's capacity.
3. **Book Slot:** Head to the Booking panel, choose your location, pick a slot, and select the hour slot you wish to reserve. Confirming uses database transactions to lock the hour block securely.

---

## 📝 License

This project is part of the Smart Booking System coursework at **VJTI, Semester 4, Software Engineering**.

**Last Updated:** June 2026
