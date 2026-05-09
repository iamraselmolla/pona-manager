# PonaTrack

Complete Mobile ERP & Order Management Application for Shrimp Seed (Pona / PL) Trading Business.

---

## Overview

PonaTrack is a full-stack mobile application designed to manage shrimp seed (Pona/PL) trading operations end-to-end. It supports order management, delivery scheduling, PL counting, customer due management, payments, daily closing, expenses, and reports/analytics for businesses handling Golda PL, Bagda PL and Vannamei PL.

This repository contains the frontend (React Native + Expo) for the mobile application.

---

## Key Features

- Pona order lifecycle: create, schedule, deliver, and close.
- Delivery counting with company/company-mir and counting-mir calculations.
- Customer management (lookup by mobile number, running order detection, dues).
- Payments and collections tracking.
- Expense tracking and daily closing summary (cash in hand, profit/loss).
- Reports and analytics (daily/monthly, PDF/Excel export).
- Offline support (SQLite) and synchronization.
- Push notifications (FCM).

---

## Complete Tech Stack (Frontend)

- Framework: React Native
- Platform: Expo
- Language: TypeScript
- Navigation: React Navigation
- State Management: Zustand or Redux Toolkit
- API Client: Axios
- Forms: React Hook Form
- Validation: Zod
- UI: NativeWind (Tailwind for React Native)
- Charts: React Native Chart Kit
- Local Storage: AsyncStorage
- Offline DB: SQLite
- Push: Firebase Cloud Messaging (FCM)
- PDF Export: React Native PDF libraries
- Date Utils: Day.js

(The backend uses Node.js + Express + TypeScript + Prisma + PostgreSQL — see backend repo.)

---

## Repo Layout (Frontend)

- src/
  - screens/ (auth, dashboard, customers, orders, delivery, expenses, closing, reports, notifications, settings)
  - components/ (common, forms, charts)
  - navigation/
  - store/
  - api/
  - hooks/
  - utils/
  - types/
  - constants/
  - App.tsx, index.tsx

---

## Getting Started (Development)

Prerequisites

- Node.js (16+)
- Yarn or npm
- Expo CLI: `npm install -g expo-cli` (or use `npx expo`)
- (Optional) Expo EAS for production builds

Install

```bash
# from repository root (frontend folder)
cd ponatrack-frontend
yarn install
# or
npm install
```

Run (development)

```bash
# Start Expo dev server
yarn start
# or
npm start
```

Open the app on your device using the Expo Go app (Android/iOS) or run in simulator.

---

## Environment Variables

Create a `.env` in the frontend root (do NOT commit secrets). Example variables used by the app:

```
REACT_NATIVE_API_BASE_URL=https://api.example.com
EXPO_FIREBASE_API_KEY=your_firebase_api_key
EXPO_FIREBASE_PROJECT_ID=your_project_id

enable_debug=true
```

---

## Build (Production)

We recommend using Expo EAS Build for production mobile binaries.

1. Install and configure `eas`:

```bash
npm install -g eas-cli
eas login
```

2. Configure `eas.json` and follow Expo docs for Android/iOS credentials.

3. Build:

```bash
eas build -p android --profile production
eas build -p ios --profile production
```

4. Download the produced APK / AAB (Android) or IPA (iOS) from EAS.

APK Build Notes (quick local testing):

- For local Android debug APK use `expo run:android` (requires Android SDK).

---

## Backend & Database (Summary)

This frontend expects a backend REST API that provides authentication (JWT), CRUD for customers/orders/deliveries/payments/expenses, daily closing endpoints, and report generation. The recommended backend stack:

- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- Auth: JWT, bcrypt for passwords
- Validation: Zod
- File upload: Multer
- Security: Helmet, CORS, rate-limiter
- Logging: Morgan
- Env: dotenv

Database hosting options: Supabase or Railway.

---

## Prisma / DB Setup (backend responsibility)

The backend should include a `prisma/schema.prisma` describing tables: `users`, `customers`, `orders`, `deliveries`, `payments`, `expenses`, `daily_closings`, `reports`, `notifications`, `customer_notes`.

Typical steps (backend):

```bash
# in backend folder
pnpm install
npx prisma migrate dev --name init
npx prisma generate
```

---

## Important Business Logic Details

- Customer identified by mobile number — use mobile as primary lookup key.
- Auto customer lookup on order creation; autofill existing info.
- Running order detection: warn when multiple open orders exist for same customer.
- Mir/shortage calculations for delivery counting vs provided quantity.
- Offline mode: store un-synced orders/activities in SQLite and sync when online.

---

## Screens & UX Summary

Refer to `src/screens/` for the implemented screens. Major flows include:

- Auth: Splash, Login, Forgot Password
- Dashboard: KPIs, charts, quick actions
- Customer: list, details, add/edit
- Orders: list, create, details, schedule
- Delivery: entry, list, details, counting, mir handling
- Expenses: list, add
- Closing: daily closing + history
- Reports: daily/monthly/customer/expense/profit-loss with export
- Notifications & Settings

---

## Deployment Guide (Summary)

Backend

- Host API on Railway / Render / VPS
- Setup environment variables and a managed Postgres DB (Supabase/Railway)
- Setup health checks, logging and monitoring

Frontend

- Use EAS Build to produce store-ready binaries
- Use Sentry (or similar) for crash reporting

---

## APK Instructions (Quick)

- Use `eas build -p android` to generate production AAB or APK.
- Use `expo run:android` for local debugging (requires Android SDK & emulator/device).

---

## Folder Structure & Contributing

Keep components small and reusable. Follow TypeScript types in `src/types`. Use `Zod` for runtime validation and centralize API calls in `src/api`.

If you contribute:

- Fork the repo
- Create a feature branch
- Open a PR with a clear description and tests where applicable

---

## Notes & Next Steps

This README covers the frontend scaffold and developer workflows. To complete the full product you still need:

- Full backend implementation and API contracts
- Prisma schema and DB migrations
- Offline sync & conflict resolution
- FCM configuration for push
- Production EAS/CI pipelines

If you want, I can now scaffold the backend `README`, `prisma/schema.prisma` starter, and example `.env` templates — tell me which you'd like next.

---

File: ponatrack-frontend/README.md
