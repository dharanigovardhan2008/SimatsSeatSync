from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class TokenRegistration(BaseModel):
    token: str
    device_info: Optional[str] = None

class TokenUnregistration(BaseModel):
    token: str

class PaymentSubmittedNotification(BaseModel):
    event_id: str
    event_title: str
    payment_utr: str
    amount: float
    student_name: str
    team_name: Optional[str] = None
    coordinator_id: str

class PaymentStatusNotification(BaseModel):
    user_id: str
    event_title: str
    amount: float
    status: str # 'approved' or 'rejected'
    reason: Optional[str] = None

class TeamInviteNotification(BaseModel):
    recipient_id: str
    team_name: str
    leader_name: str

class TeamInviteResponseNotification(BaseModel):
    leader_id: str
    recipient_name: str
    team_name: str
    accepted: bool

class TeamRegisteredNotification(BaseModel):
    member_ids: List[str]
    event_title: str
    team_name: str

class EventUpdateNotification(BaseModel):
    event_id: str
    event_title: str
    update_type: str # 'updated', 'cancelled', 'reminder'
    message: Optional[str] = None

class GenericNotification(BaseModel):
    recipient_ids: List[str]
    title: str
    body: str
    link: Optional[str] = None
    data: Optional[Dict[str, str]] = None
