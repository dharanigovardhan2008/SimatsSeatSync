# SeatSync Python Notification Backend (Render)

This backend provides real device push notifications via Firebase Cloud Messaging (FCM) using Firebase Admin SDK.

## Environment Variables (Render)

Set the following environment variables in Render:

| Variable                       | Description |
|--------------------------------|-------------|
| `PORT`                         | Internal port (default 8000). Render overrides this automatically. |
| `FRONTEND_URL`                 | Your deployed SeatSync PWA frontend URL (e.g., `https://simats-seatsync.web.app`). Used for CORS. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | **Option 1 (Recommended)**: Copy the entire service account JSON as a single string. |
| OR separate variables:         | **Option 2**: |
| `FIREBASE_PROJECT_ID`          | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL`        | Firebase Admin SDK client email |
| `FIREBASE_PRIVATE_KEY`         | Private key with escaped newlines (`\n`) |

### How to get Firebase Admin credentials

1. Go to Firebase Console → Project Settings → Service Accounts.
2. Click **"Generate new private key"**.
3. Download the JSON file.
4. Either:
   - **Option A**: Copy the entire JSON content into `FIREBASE_SERVICE_ACCOUNT_JSON` as a single string.
   - **Option B**: Extract:
     - `project_id`
     - `client_email`
     - `private_key` (replace `\n` literal with actual newlines in the environment variable)

### Example Render Environment Setup

```bash
# Example using service account JSON (easier)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"simats-seatsync","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-...@simats-seatsync.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/..."}

FRONTEND_URL=https://simats-seatsync.web.app
PORT=8000
```

## Deploy to Render

1. Push the `/backend` directory to a GitHub repository.
2. Go to [render.com](https://render.com) → New Web Service → Connect your repository.
3. Configure:
   - **Name**: `seatsync-notifications`
   - **Root Directory**: `backend`
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables as described above.
5. Click **"Create Web Service"**.

Render will assign a public URL like `https://seatsync-notifications.onrender.com`.

## Update Frontend

Set environment variable in frontend (`.env` or `VITE_*` in Vite):

```env
VITE_NOTIFICATION_API_URL=https://seatsync-notifications.onrender.com
```

If using Vite, update `vite.config.ts` to allow the backend origin.

## Backend Endpoints

All endpoints require Firebase ID Token (`Bearer <idToken>`) in the `Authorization` header.

- `POST /api/tokens/register` – Register FCM token.
- `POST /api/tokens/unregister` – Remove token.
- `POST /api/notifications/payment-submitted` – Notify coordinator about a payment submission.
- `POST /api/notifications/payment-status` – Notify user about approval/rejection.
- `POST /api/notifications/team-invite` – Notify a teammate about invitation.
- `POST /api/notifications/team-invite-response` – Notify leader about invite acceptance/decline.
- `POST /api/notifications/team-registered` – Notify all team members after registration.
- `POST /api/notifications/event-update` – Notify all registered participants about event update/cancellation/reminder.

## Testing Locally

1. Install Python 3.11+
2. Install dependencies: `pip install -r requirements.txt`
3. Set environment variables in `.env` file (copy from `.env.example`).
4. Run: `uvicorn main:app --reload`
5. Backend runs at `http://localhost:8000`.
6. Verify health: `curl http://localhost:8000/health`

## Token Storage

- User tokens are stored in Firestore under `users/{userId}` with fields:
  - `fcmToken` (string, singular, backward compatibility)
  - `fcmTokens` (array, supports multiple devices)
- Invalid tokens are automatically removed when FCM returns unregistered/invalid error.

## Frontend Integration

The frontend already includes `notificationApi.ts` that calls the backend endpoints. The `AuthContext.tsx` automatically calls `registerFCMToken` on login. The following actions now trigger device push notifications:

- Payment submission (coordinator)
- Payment approval/rejection (user)
- Team invitation (teammate)
- Teammate acceptance/decline (leader)
- Team registration (all members)

## Offline & PWA

- The app is a Progressive Web App with a service worker caching the app shell.
- Offline pages show a "Requires internet" message for payment/registration actions.
- APK download modal has been removed. Users can install via "Add to Home Screen" on mobile.

## Important Notes

- **Never expose Firebase Admin credentials in the frontend.** They are only in the Python backend.
- Render free tier sleeps after inactivity; notifications may be delayed ~30 seconds when waking.
- Use FCM foreground listeners (`onMessage`) for in-app banners when the app is open.
- Ensure Firebase Firestore Security Rules allow reading/writing `fcmToken` for the authenticated user.

## Verification

1. Login as a user, grant notification permission, verify token stored in `users/{uid}/fcmToken`.
2. Submit a payment for a paid event, check coordinator's device for push notification.
3. Approve the payment via PaymentVerificationModal, check user device for approval push.
4. Invite a teammate, ensure they receive both in-app and push notification.
5. Accept invite, leader receives push notification.
6. Team registration triggers push notifications to all members.
7. APK download popup should never appear.

## Troubleshooting

- **No push notifications**: Check FCM token exists in Firestore, verify `FIREBASE_SERVICE_ACCOUNT_JSON` is valid, check browser console for API errors.
- **CORS errors**: Ensure `FRONTEND_URL` matches the deployed frontend origin.
- **401 Unauthorized**: Token missing or expired; frontend should refresh token automatically.
- **500 Internal Error**: Check Render logs for Firebase Admin initialization issues.
