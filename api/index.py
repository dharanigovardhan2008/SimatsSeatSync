import os
import json
import logging
from typing import List
from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

import firebase_admin
from firebase_admin import credentials, auth, messaging, firestore

try:
    from .models import (
        TokenRegistration,
        TokenUnregistration,
        PaymentSubmittedNotification,
        PaymentStatusNotification,
        TeamInviteNotification,
        TeamInviteResponseNotification,
        TeamRegisteredNotification,
        EventUpdateNotification,
        GenericNotification
    )
except ImportError:
    from models import (
        TokenRegistration,
        TokenUnregistration,
        PaymentSubmittedNotification,
        PaymentStatusNotification,
        TeamInviteNotification,
        TeamInviteResponseNotification,
        TeamRegisteredNotification,
        EventUpdateNotification,
        GenericNotification
    )

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SeatSync Notification API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase Admin SDK
def get_db():
    if not firebase_admin._apps:
        service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        if service_account_json:
            try:
                cert_dict = json.loads(service_account_json)
                cred = credentials.Certificate(cert_dict)
                firebase_admin.initialize_app(cred)
            except Exception as e:
                logger.error(f"Failed to load FIREBASE_SERVICE_ACCOUNT_JSON: {e}")
                raise e
        else:
            project_id = os.getenv("FIREBASE_PROJECT_ID")
            client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
            private_key = os.getenv("FIREBASE_PRIVATE_KEY")

            if project_id and client_email and private_key:
                private_key = private_key.replace('\\n', '\n')
                cred = credentials.Certificate({
                    "type": "service_account",
                    "project_id": project_id,
                    "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID", ""),
                    "private_key": private_key,
                    "client_email": client_email,
                    "client_id": os.getenv("FIREBASE_CLIENT_ID", ""),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{client_email.replace('@', '%40')}"
                })
                firebase_admin.initialize_app(cred)
            else:
                logger.warning("No Firebase Admin credentials provided in environment.")
    return firestore.client()


async def verify_auth(authorization: str = Header(...)):
    """Auth middleware checking the Bearer Firebase ID token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid token format")

    id_token = authorization.split("Bearer ")[1]
    try:
        # Ensure Firebase is initialized
        get_db()
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

def get_user_fcm_tokens(user_id: str) -> List[str]:
    """Retrieve all active FCM tokens for a given user."""
    tokens = []
    try:
        db = get_db()
        user_doc = db.collection('users').document(user_id).get()
        if user_doc.exists:
            data = user_doc.to_dict()
            if 'fcmToken' in data and data['fcmToken']:
                tokens.append(data['fcmToken'])
            if 'fcmTokens' in data and isinstance(data['fcmTokens'], list):
                tokens.extend(data['fcmTokens'])
    except Exception as e:
        logger.error(f"Error fetching tokens for user {user_id}: {e}")
    return list(set(tokens))

def cleanup_invalid_tokens(user_id: str, invalid_tokens: List[str]):
    """Remove expired/unregistered tokens from the user's document."""
    if not invalid_tokens:
        return
    try:
        db = get_db()
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        if user_doc.exists:
            data = user_doc.to_dict()
            if 'fcmTokens' in data and isinstance(data['fcmTokens'], list):
                new_tokens = [t for t in data['fcmTokens'] if t not in invalid_tokens]
                user_ref.update({'fcmTokens': new_tokens})
            elif 'fcmToken' in data and data['fcmToken'] in invalid_tokens:
                user_ref.update({'fcmToken': firestore.DELETE_FIELD})
    except Exception as e:
        logger.error(f"Failed to cleanup tokens for user {user_id}: {e}")


def send_fcm_multicast(user_id: str, title: str, body: str, data: dict = None, link: str = None) -> bool:
    """Send a push notification to all devices belonging to a user."""
    tokens = get_user_fcm_tokens(user_id)
    if not tokens:
        logger.info(f"No FCM tokens found for user {user_id}")
        return False

    if not data:
        data = {}
    if link:
        data["link"] = link

    message = messaging.MulticastMessage(
        notification=messaging.Notification(title=title, body=body),
        data=data,
        tokens=tokens
    )

    try:
        response = messaging.send_each_for_multicast(message)
        logger.info(f"Sent {response.success_count} messages, {response.failure_count} failed.")

        if response.failure_count > 0:
            invalid_tokens = []
            for idx, resp in enumerate(response.responses):
                if not resp.success:
                    err_code = resp.exception.code if resp.exception else "unknown"
                    if err_code in ["NOT_FOUND", "INVALID_ARGUMENT", "UNREGISTERED",
                                    "messaging/invalid-registration-token",
                                    "messaging/registration-token-not-registered"]:
                        invalid_tokens.append(tokens[idx])
            cleanup_invalid_tokens(user_id, invalid_tokens)
        return response.success_count > 0
    except Exception as e:
        logger.error(f"Failed to send multicast message: {e}")
        return False

@app.get("/")
@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "SeatSync Notification API on Vercel Serverless"}

@app.post("/api/tokens/register")
def register_token(req: TokenRegistration, user: dict = Depends(verify_auth)):
    uid = user['uid']
    db = get_db()
    user_ref = db.collection('users').document(uid)

    doc = user_ref.get()
    if doc.exists:
        data = doc.to_dict()
        tokens = data.get('fcmTokens', [])
        if req.token not in tokens:
            tokens.append(req.token)
            user_ref.update({'fcmTokens': tokens, 'fcmToken': req.token})
    return {"status": "success", "message": "Token registered"}

@app.post("/api/tokens/unregister")
def unregister_token(req: TokenUnregistration, user: dict = Depends(verify_auth)):
    uid = user['uid']
    cleanup_invalid_tokens(uid, [req.token])
    return {"status": "success", "message": "Token unregistered"}

@app.post("/api/notifications/payment-submitted")
def notify_payment_submitted(req: PaymentSubmittedNotification, user: dict = Depends(verify_auth)):
    title = "Payment Verification Required"
    context_name = req.student_name if not req.team_name else f"{req.student_name} (Team {req.team_name})"
    body = f"{context_name} submitted payment reference [{req.payment_utr}] for [{req.event_title}]."

    send_fcm_multicast(
        user_id=req.coordinator_id,
        title=title,
        body=body,
        data={"event_id": req.event_id, "type": "payment_submitted"},
        link="/admin/events" if user.get('role') == 'admin' else "/coordinator"
    )
    return {"status": "queued"}

@app.post("/api/notifications/payment-status")
def notify_payment_status(req: PaymentStatusNotification, user: dict = Depends(verify_auth)):
    if req.status == 'approved':
        title = "Payment Successful"
        body = f"Your payment for [{req.event_title}] has been approved."
    else:
        title = "Payment Verification Failed"
        body = f"Your payment for [{req.event_title}] was rejected"
        if req.reason:
            body += f": {req.reason}"
        else:
            body += "."

    send_fcm_multicast(
        user_id=req.user_id,
        title=title,
        body=body,
        data={"type": "payment_status", "status": req.status},
        link="/tickets"
    )
    return {"status": "queued"}

@app.post("/api/notifications/team-invite")
def notify_team_invite(req: TeamInviteNotification, user: dict = Depends(verify_auth)):
    title = "Team Invitation"
    body = f"{req.leader_name} invited you to join team '{req.team_name}'."

    send_fcm_multicast(
        user_id=req.recipient_id,
        title=title,
        body=body,
        data={"type": "team_invite"},
        link="/teams"
    )
    return {"status": "queued"}

@app.post("/api/notifications/team-invite-response")
def notify_team_invite_response(req: TeamInviteResponseNotification, user: dict = Depends(verify_auth)):
    title = "Teammate Accepted" if req.accepted else "Invitation Declined"
    action = "accepted" if req.accepted else "declined"
    body = f"{req.recipient_name} has {action} your invite for '{req.team_name}'."

    send_fcm_multicast(
        user_id=req.leader_id,
        title=title,
        body=body,
        data={"type": "team_invite_response"},
        link="/teams"
    )
    return {"status": "queued"}

@app.post("/api/notifications/team-registered")
def notify_team_registered(req: TeamRegisteredNotification, user: dict = Depends(verify_auth)):
    title = "Team Enrolled 🎉"
    body = f"Your team '{req.team_name}' has been registered for [{req.event_title}]!"

    for member_id in req.member_ids:
        send_fcm_multicast(
            user_id=member_id,
            title=title,
            body=body,
            data={"type": "team_registered"},
            link="/tickets"
        )
    return {"status": "queued"}

@app.post("/api/notifications/event-update")
def notify_event_update(req: EventUpdateNotification, user: dict = Depends(verify_auth)):
    title = f"Event {req.update_type.title()}: {req.event_title}"
    body = req.message if req.message else f"Important updates to {req.event_title}."

    try:
        db = get_db()
        registrations = db.collection('registrations').where('event_id', '==', req.event_id).where('status', '==', 'confirmed').stream()
        notified_users = set()
        for reg in registrations:
            data = reg.to_dict()
            uid = data.get('user_id')
            if uid and uid not in notified_users:
                send_fcm_multicast(uid, title, body, link=f"/event/{req.event_id}")
                notified_users.add(uid)
    except Exception as e:
        logger.error(f"Failed to fetch event registrations for update: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch registrations")

    return {"status": "queued", "notified_count": len(notified_users) if 'notified_users' in locals() else 0}

@app.post("/api/notifications/send")
def notify_generic(req: GenericNotification, user: dict = Depends(verify_auth)):
    logger.info(f"Generic notification requested by {user['uid']} to {req.recipient_ids}")

    for uid in req.recipient_ids:
        send_fcm_multicast(uid, req.title, req.body, req.data, req.link)
    return {"status": "queued"}
