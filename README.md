# SeatSync – Workshop & Seminar Management System

SeatSync is a premium event management platform built for SIMATS Engineering College, featuring Apple-style glassmorphism design, real-time registration, QR code ticketing, and comprehensive admin tools.

## ✨ Features

### For Students
- 🔍 **Browse & Register** – View upcoming workshops, seminars, and hackathons tailored to your department
- 🎟 **QR Tickets** – Instant QR tickets for enrolled events
- 👥 **Team Registration** – Form teams and register together for team-based events
- 📱 **Mobile-first** – Responsive design optimized for all devices
- 🔔 **Real-time Notifications** – Stay updated on event changes and announcements

### For Coordinators & Admins
- 📊 **Event Management** – Create, edit, and manage events with approval workflows
- ✅ **QR Scanning** – Scan student tickets for attendance verification
- 💰 **Payment Processing** – Manage paid events with verification workflows
- 📈 **Analytics Dashboard** – Monitor registration trends and seat utilization
- 👤 **User Management** – Manage student accounts and permissions

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom glassmorphism design system
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Routing**: React Router v6
- **Real-time**: Firebase Firestore listeners
- **PWA**: Service Worker + Web Manifest for offline capability

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account (for backend services)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd SimatsSeatSync

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Fill in your Firebase configuration in .env
```

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Enable Cloud Storage (for event images)
5. Copy your Firebase config to `.env`:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── events/         # Event-related components
│   ├── layout/         # Layout components (Navbar, etc.)
│   └── ui/             # Generic UI components
├── context/            # React contexts (Auth, Loading)
├── lib/                # Utilities and Firebase integration
├── pages/              # Page components
│   ├── public/         # Public pages (Home, Login, Register)
│   ├── student/        # Student dashboard and features
│   ├── admin/          # Admin dashboard and tools
│   └── coordinator/    # Coordinator management pages
└── index.css           # Global styles with custom glassmorphism
```

## 👥 User Roles

- **Student**: Browse events, register, manage tickets, join teams
- **Coordinator**: Create events, manage enrollments, scan QR codes
- **Admin**: Approve/reject events, manage users, view analytics

## 🔐 Security

- Firebase Firestore Security Rules enforce data access controls
- Role-based access control for all routes
- Input validation and sanitization on forms
- Protected API endpoints with authentication checks

## 🌐 PWA Features

- Offline support for browsing events
- Installable on mobile devices
- Push notifications (future enhancement)
- Service worker caches static assets

## 🚀 Deployment

### Vercel / Netlify
```bash
# Build and deploy
npm run build
```

The production build outputs to `dist/` folder which can be deployed to any static hosting service.

### Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Deploy
firebase login
firebase deploy --only hosting
```

## 📞 Support

For support, contact:
- **Email**: support@simats.edu
- **Phone**: +91 44 2680 1999
- **Office**: SIMATS Engineering College

## 📄 License

Proprietary - © 2026 SIMATS Engineering College. All rights reserved.

---

**Built with** ❤️ by the SIMATS Tech Team