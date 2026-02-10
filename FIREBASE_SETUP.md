# Firebase Cloud Functions Setup Guide

## Prerequisites
- Node.js 18 or later
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project created

## Setup Instructions

### Step 1: Login to Firebase
```bash
firebase login
```

### Step 2: Initialize Firebase in your project (if not already done)
```bash
firebase init
```
Select:
- Firestore
- Functions
- Hosting

### Step 3: Set SendGrid API Key
```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
```

> **Note:** Replace `YOUR_SENDGRID_API_KEY` with your actual SendGrid API key from https://sendgrid.com/

### Step 4: Install Dependencies
```bash
cd functions
npm install
cd ..
```

### Step 5: Deploy Functions
```bash
firebase deploy --only functions
```

### Step 6: Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Step 7: Deploy Hosting (Frontend)
```bash
npm run build
firebase deploy --only hosting
```

### Step 8: Deploy Everything
```bash
npm run build
firebase deploy
```

## Cloud Functions Overview

### 1. sendWelcomeEmail
- **Trigger**: When a new user is created in Firebase Auth
- **Action**: Sends a welcome email to the user
- **Email**: Beautiful HTML email with Neumorphism design

### 2. sendRegistrationEmail
- **Trigger**: When a new document is created in `registrations` collection
- **Action**: Sends an event registration confirmation email
- **Email**: Contains event details (title, type, date)

### 3. sendNewEventNotification
- **Trigger**: When a new document is created in `events` collection
- **Action**: Sends notification to all students about the new event
- **Email**: Contains event details and register button

## Firestore Security Rules

The `firestore.rules` file contains security rules for:

### Users Collection
- Users can read/write only their own profile
- Admin can read all users

### Events Collection
- All authenticated users can read events
- Only admin can create/update/delete events

### Registrations Collection
- Users can read their own registrations
- Admin can read all registrations
- Users can create registrations for themselves
- No one can update registrations
- Users can delete their own registrations

## Folder Structure
```
your-project/
├── functions/
│   ├── index.js          # Cloud Functions code
│   ├── package.json      # Functions dependencies
│   └── .gitignore
├── src/                   # React frontend
├── firebase.json          # Firebase configuration
├── firestore.rules        # Firestore security rules
├── firestore.indexes.json # Firestore indexes
└── FIREBASE_SETUP.md      # This file
```

## Testing Locally

### Test Functions Locally
```bash
cd functions
npm run serve
```

### View Function Logs
```bash
firebase functions:log
```

## Troubleshooting

### SendGrid Email Not Sending
1. Verify the sender email in SendGrid dashboard
2. Check function logs: `firebase functions:log`
3. Ensure API key is set: `firebase functions:config:get`

### Function Deployment Fails
1. Check Node.js version (must be 18)
2. Run `npm install` in functions folder
3. Check for syntax errors in index.js

### Firestore Permission Denied
1. Ensure user is authenticated
2. Check firestore.rules for proper permissions
3. Deploy rules: `firebase deploy --only firestore:rules`
