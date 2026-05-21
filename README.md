<div align="center">

# 🎓 SimatsSeatSync

### Workshop & Seminar Seat Booking Platform for SIMATS

[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-12-f5820d?style=flat-square&logo=firebase&logoColor=white)](https://firebase.google.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![License](https://img.shields.io/badge/license-private-red?style=flat-square)]()

**[🌐 Live Demo](https://simats-seat-sync.vercel.app)** · **[📋 Firebase Setup Guide](./FIREBASE_SETUP.md)** · **[🐛 Report a Bug](https://github.com/dharanigovardhan2008/SimatsSeatSync/issues)**

</div>

---

## 📖 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Cloud Functions](#-cloud-functions)
- [Firestore Security Rules](#-firestore-security-rules)
- [Available Scripts](#-available-scripts)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## 🎯 About

**SimatsSeatSync** is a full-stack web application that streamlines event registration at SIMATS. Students can browse upcoming workshops and seminars, book their seats in real time, and receive automated email confirmations. Admins get a dedicated panel to create and manage events, with notifications automatically going out to all students when something new is published.

Built entirely on a serverless stack — no backend server to maintain. Firebase handles authentication, the database, and cloud functions. The frontend is deployed on Vercel.

---

## ✨ Features

### For Students
- 🔍 **Browse Events** — View all upcoming workshops and seminars with details like date, type, and available seats
- 🎫 **Book a Seat** — Register for events instantly; seat counts update in real time across all users
- 📧 **Email Confirmations** — Receive an automated booking confirmation with full event details
- 👤 **Profile Management** — Manage your own account and view your registrations
- 🔔 **New Event Alerts** — Get notified by email whenever a new event is published

### For Admins
- ➕ **Create Events** — Add new workshops or seminars with all relevant details
- ✏️ **Edit & Delete** — Update or remove events; changes reflect instantly for all users
- 📊 **View All Registrations** — See who has registered for any event across the platform

### Platform
- 🔐 **Secure Auth** — Firebase Authentication with role-based access control
- ⚡ **Real-Time Updates** — Firestore listeners keep the UI live without manual refreshes
- 📱 **Responsive Design** — Works on desktop and mobile

---

## 🛠 Tech Stack

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend** | React | 19 | UI framework |
| **Language** | TypeScript | 5 | Type safety |
| **Build Tool** | Vite | 7 | Fast dev server & bundler |
| **Styling** | Tailwind CSS | 4 | Utility-first CSS |
| **Routing** | React Router | 7 | Client-side navigation |
| **Database** | Firebase Firestore | 12 | Real-time NoSQL database |
| **Auth** | Firebase Auth | 12 | User authentication |
| **Functions** | Firebase Cloud Functions | — | Serverless email triggers |
| **Email** | SendGrid | — | Transactional email delivery |
| **Hosting** | Vercel + Firebase | — | Frontend + Functions hosting |

---

## 📁 Project Structure

```
SimatsSeatSync/
│
├── src/                          # React + TypeScript frontend
│   ├── components/               # Reusable UI components
│   ├── pages/                    # Route-level page components
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Firebase client config & helpers
│   └── main.tsx                  # App entry point
│
├── functions/                    # Firebase Cloud Functions (Node.js)
│   ├── index.js                  # All function definitions
│   └── package.json              # Functions dependencies
│
├── firebase.json                 # Firebase project configuration
├── firestore.rules               # Firestore security rules
├── firestore.indexes.json        # Composite query indexes
├── index.html                    # HTML entry point
├── vite.config.ts                # Vite build configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Frontend dependencies & scripts
└── FIREBASE_SETUP.md             # Detailed Firebase deployment guide
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed and set up before you begin:

- **Node.js** v18 or later — [Download](https://nodejs.org)
- **Firebase CLI** — `npm install -g firebase-tools`
- **Firebase project** with these services enabled:
  - Authentication (Email/Password provider)
  - Firestore Database
  - Cloud Functions
  - Hosting
- **SendGrid account** — [Sign up free](https://sendgrid.com) for transactional email

### Step 1 — Clone the repository

```bash
git clone https://github.com/dharanigovardhan2008/SimatsSeatSync.git
cd SimatsSeatSync
```

### Step 2 — Install frontend dependencies

```bash
npm install
```

### Step 3 — Install Cloud Functions dependencies

```bash
cd functions
npm install
cd ..
```

### Step 4 — Set up environment variables

Create a `.env` file in the project root (see [Environment Variables](#-environment-variables) below).

### Step 5 — Configure SendGrid API key

```bash
firebase login
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
```

> Get your API key from the [SendGrid dashboard](https://app.sendgrid.com/settings/api_keys). Make sure your sender email is verified.

### Step 6 — Run the development server

```bash
npm run dev
```

The app will be running at **http://localhost:5173**

---

## 🔑 Environment Variables

Create a `.env` file at the project root with your Firebase project credentials. You can find these in your [Firebase Console](https://console.firebase.google.com) under **Project Settings → General → Your apps**.

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> ⚠️ **Never commit your `.env` file.** Add it to `.gitignore` to keep your credentials safe.

---

## 📦 Deployment

### Deploy everything at once

```bash
npm run build
firebase deploy
```

### Deploy frontend only (Firebase Hosting)

```bash
npm run build
firebase deploy --only hosting
```

### Deploy Cloud Functions only

```bash
firebase deploy --only functions
```

### Deploy Firestore rules only

```bash
firebase deploy --only firestore:rules
```

### Test functions locally before deploying

```bash
cd functions
npm run serve
```

> For a full step-by-step guide, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).

---

## ☁️ Cloud Functions

Three Firebase Cloud Functions automate all email communication using SendGrid. They are triggered by database events, so no manual calls are needed.

### `sendWelcomeEmail`
- **Trigger:** A new user is created in Firebase Auth
- **Action:** Sends a welcome email to the new user
- **Template:** HTML email with Neumorphism design

### `sendRegistrationEmail`
- **Trigger:** A new document is added to the `registrations` Firestore collection
- **Action:** Sends a booking confirmation email containing the event title, type, and date

### `sendNewEventNotification`
- **Trigger:** A new document is added to the `events` Firestore collection
- **Action:** Sends an email to all students announcing the new event, with a registration link

### View function logs

```bash
firebase functions:log
```

---

## 🔒 Firestore Security Rules

Access is controlled by user role. Students can only access their own data; admins have broader read access and full control over events.

### `users` collection

| Role | Permissions |
|---|---|
| Student | Read and write their **own** profile only |
| Admin | Read all user profiles |

### `events` collection

| Role | Permissions |
|---|---|
| Student | Read all events |
| Admin | Read, create, update, and delete all events |

### `registrations` collection

| Role | Permissions |
|---|---|
| Student | Read, create, and delete their **own** registrations — no updates |
| Admin | Read all registrations |

---

## 📜 Available Scripts

Run these from the project root:

```bash
npm run dev        # Start the Vite development server (localhost:5173)
npm run build      # Compile TypeScript and bundle for production
npm run preview    # Preview the production build locally
```

Run these from inside the `functions/` directory:

```bash
npm run serve      # Run Cloud Functions locally using the Firebase emulator
```

---

## 🔧 Troubleshooting

### Emails not sending via SendGrid

1. Confirm your sender email is verified in the [SendGrid dashboard](https://app.sendgrid.com/settings/sender_auth)
2. Check that your API key is configured: `firebase functions:config:get`
3. Inspect function logs for errors: `firebase functions:log`

### Function deployment fails

1. Check your Node.js version — it must be **v18 or later**: `node --version`
2. Run `npm install` inside the `functions/` folder
3. Look for syntax errors in `functions/index.js`

### Firestore "permission denied" error

1. Make sure the user is signed in before making any Firestore calls
2. Review your `firestore.rules` — check the role conditions
3. Redeploy the rules: `firebase deploy --only firestore:rules`

### `firebase` command not found

Install the Firebase CLI globally:

```bash
npm install -g firebase-tools
firebase login
```

---

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome.

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "Add your feature"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please open an issue first for major changes so we can discuss the approach.

---

<div align="center">

Made with ❤️ by [@dharanigovardhan2008](https://github.com/dharanigovardhan2008)

[🌐 Live Demo](https://simats-seat-sync.vercel.app) · [📋 Firebase Setup](./FIREBASE_SETUP.md) · [⭐ Star this repo](https://github.com/dharanigovardhan2008/SimatsSeatSync)

</div>
