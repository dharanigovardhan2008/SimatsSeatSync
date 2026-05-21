# SimatsSeatSync

> A workshop and seminar seat booking application for SIMATS — built with React, TypeScript, Firebase, and Tailwind CSS.

🌐 **Live Demo:** [simats-seat-sync.vercel.app](https://simats-seat-sync.vercel.app)

---

## About

SimatsSeatSync is a web application that allows students and staff to browse, register for, and manage seats at workshops and seminars. Admins can create and manage events, while automated email notifications keep participants informed at every step.

---

## Tech Stack

| Layer       | Technology                              |
|-------------|------------------------------------------|
| Frontend    | React 19, TypeScript 5, Vite 7          |
| Styling     | Tailwind CSS 4                          |
| Backend     | Firebase (Auth, Firestore, Functions)   |
| Email       | SendGrid (via Firebase Cloud Functions) |
| Deployment  | Vercel (frontend), Firebase (functions) |

---

## Features

- **Event Browsing** — Students can view all upcoming workshops and seminars.
- **Seat Booking** — Authenticated users can register for available events.
- **Admin Panel** — Admins can create, update, and delete events.
- **Email Notifications** — Automated emails for:
  - Welcome message on signup
  - Registration confirmation with event details
  - New event announcements sent to all students
- **Role-based Access** — Firestore security rules enforce student vs. admin permissions.

---

## Project Structure

```
SimatsSeatSync/
├── src/                   # React frontend source
├── functions/             # Firebase Cloud Functions
│   ├── index.js           # Cloud Function handlers
│   └── package.json
├── firebase.json          # Firebase project configuration
├── firestore.rules        # Firestore security rules
├── firestore.indexes.json # Firestore query indexes
├── index.html             # App entry point
├── vite.config.ts         # Vite build configuration
├── tsconfig.json          # TypeScript configuration
└── FIREBASE_SETUP.md      # Firebase deployment guide
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project with Firestore, Auth, Functions, and Hosting enabled
- A [SendGrid](https://sendgrid.com/) account and API key

### 1. Clone the Repository

```bash
git clone https://github.com/dharanigovardhan2008/SimatsSeatSync.git
cd SimatsSeatSync
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Firebase

Create a `.env` file (or configure `src/firebase.ts`) with your Firebase project credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Set SendGrid API Key (for email functions)

```bash
firebase login
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
```

### 5. Run Locally

```bash
npm run dev
```

---

## Deployment

### Deploy Frontend

```bash
npm run build
firebase deploy --only hosting
```

### Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Deploy Everything

```bash
npm run build
firebase deploy
```

---

## Firebase Cloud Functions

| Function                  | Trigger                                  | Action                                          |
|---------------------------|------------------------------------------|-------------------------------------------------|
| `sendWelcomeEmail`        | New user created in Firebase Auth        | Sends a welcome email to the new user           |
| `sendRegistrationEmail`   | New document in `registrations` collection | Sends booking confirmation with event details  |
| `sendNewEventNotification`| New document in `events` collection      | Notifies all students of the new event          |

---

## Firestore Security Rules Summary

| Collection       | Students                        | Admin                         |
|------------------|---------------------------------|-------------------------------|
| `users`          | Read/write own profile only     | Read all users                |
| `events`         | Read all events                 | Create, update, delete events |
| `registrations`  | Read/create/delete own records  | Read all registrations        |

---

## Available Scripts

| Command           | Description                      |
|-------------------|----------------------------------|
| `npm run dev`     | Start development server         |
| `npm run build`   | Build for production             |
| `npm run preview` | Preview production build locally |

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

## License

This project is private and maintained by [@dharanigovardhan2008](https://github.com/dharanigovardhan2008).
