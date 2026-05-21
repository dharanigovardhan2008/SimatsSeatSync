<div align="center">

# SimatsSeatSync

**A real-time workshop & seminar seat booking platform for SIMATS**

[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-12-f5820d?style=flat-square&logo=firebase&logoColor=white)](https://firebase.google.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)

[**Live Demo →**](https://simats-seat-sync.vercel.app)

</div>

---

## About

SimatsSeatSync lets students browse and register for workshops and seminars at SIMATS. Admins manage events through a dedicated panel, and automated email notifications keep everyone informed — from signup to booking confirmation to new event announcements.

---

## Features

| Feature | Description |
|---|---|
| 📅 **Event Browsing** | View all upcoming workshops and seminars with full details |
| 🎫 **Seat Booking** | Register for events with real-time seat availability via Firestore |
| ⚙️ **Admin Panel** | Create, update, and delete events — changes reflect instantly |
| ✉️ **Email Notifications** | Automated welcome, booking, and announcement emails via SendGrid |
| 🔐 **Role-Based Access** | Firestore security rules separate student and admin permissions |
| ☁️ **Serverless Backend** | Firebase Auth + Firestore + Cloud Functions — no server needed |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript 5, Vite 7 |
| Styling | Tailwind CSS 4 |
| Routing | React Router 7 |
| Backend | Firebase (Auth, Firestore, Cloud Functions) |
| Email | SendGrid |
| Hosting | Vercel (frontend) + Firebase Hosting |

---

## Project Structure

```
SimatsSeatSync/
├── src/                        # React + TypeScript frontend
│   ├── components/             # Reusable UI components
│   ├── pages/                  # Route-level page components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Firebase client config
│   └── main.tsx
├── functions/                  # Firebase Cloud Functions
│   ├── index.js                # All Cloud Function handlers
│   └── package.json
├── firebase.json               # Firebase project config
├── firestore.rules             # Firestore security rules
├── firestore.indexes.json      # Composite query indexes
├── index.html
├── vite.config.ts
├── tsconfig.json
└── FIREBASE_SETUP.md           # Full Firebase deployment guide
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase CLI — `npm install -g firebase-tools`
- A Firebase project with **Auth**, **Firestore**, **Functions**, and **Hosting** enabled
- A [SendGrid](https://sendgrid.com) account and API key

### 1. Clone & install

```bash
git clone https://github.com/dharanigovardhan2008/SimatsSeatSync.git
cd SimatsSeatSync
npm install
```

### 2. Configure Firebase

Create a `.env` file at the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Set the SendGrid API key

```bash
firebase login
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
```

### 4. Run locally

```bash
npm run dev
# → http://localhost:5173
```

---

## Deployment

Deploy everything in one command:

```bash
npm run build
firebase deploy
```

Or deploy targets individually:

```bash
# Frontend (Firebase Hosting)
npm run build && firebase deploy --only hosting

# Cloud Functions
cd functions && npm install && cd ..
firebase deploy --only functions

# Firestore security rules
firebase deploy --only firestore:rules
```

> See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for a detailed step-by-step guide.

---

## Cloud Functions

Three Firebase Cloud Functions handle all email automation via SendGrid:

| Function | Trigger | Action |
|---|---|---|
| `sendWelcomeEmail` | New user created (Firebase Auth) | Sends a welcome email to the new user |
| `sendRegistrationEmail` | New doc in `registrations` collection | Sends booking confirmation with event details |
| `sendNewEventNotification` | New doc in `events` collection | Notifies all students of the new event |

---

## Firestore Security Rules

| Collection | Students | Admin |
|---|---|---|
| `users` | Read/write **own profile only** | Read all users |
| `events` | Read all events | Read, create, update, delete |
| `registrations` | Read, create, delete **own records** — no update | Read all registrations |

---

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview the production build locally
```

---

## Troubleshooting

**SendGrid email not sending**
Verify the sender email in your SendGrid dashboard. Check logs with `firebase functions:log` and confirm the key is set with `firebase functions:config:get`.

**Function deployment fails**
Confirm Node.js is version 18+. Run `npm install` inside the `functions/` folder and check for syntax errors in `index.js`.

**Firestore permission denied**
Confirm the user is authenticated, review `firestore.rules`, and redeploy with `firebase deploy --only firestore:rules`.

---

<div align="center">

Built by [@dharanigovardhan2008](https://github.com/dharanigovardhan2008) · [Live Demo](https://simats-seat-sync.vercel.app) · [Firebase Setup Guide](./FIREBASE_SETUP.md)

</div>
