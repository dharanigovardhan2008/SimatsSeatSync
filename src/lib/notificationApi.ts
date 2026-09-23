import { auth } from './firebase';

const getBackendUrl = () => {
  return import.meta.env.VITE_NOTIFICATION_API_URL || '';
};

const getAuthToken = async () => {
  if (!auth.currentUser) throw new Error('Not authenticated');
  return await auth.currentUser.getIdToken();
};

export const registerFCMTokenAPI = async (token: string, deviceInfo?: string) => {
  try {
    const idToken = await getAuthToken();
    const res = await fetch(`${getBackendUrl()}/api/tokens/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ token, device_info: deviceInfo }),
    });
    if (!res.ok) throw new Error('Failed to register FCM token');
  } catch (err) {
    console.error('API register FCM Error:', err);
  }
};

export const unregisterFCMTokenAPI = async (token: string) => {
  try {
    const idToken = await getAuthToken();
    await fetch(`${getBackendUrl()}/api/tokens/unregister`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ token }),
    });
  } catch (err) {
    console.error('API unregister FCM Error:', err);
  }
};

export const notifyPaymentSubmittedAPI = async (
  eventId: string,
  eventTitle: string,
  paymentUtr: string,
  amount: number,
  studentName: string,
  coordinatorId: string,
  teamName?: string
) => {
  try {
    const idToken = await getAuthToken();
    await fetch(`${getBackendUrl()}/api/notifications/payment-submitted`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({
        event_id: eventId,
        event_title: eventTitle,
        payment_utr: paymentUtr,
        amount,
        student_name: studentName,
        team_name: teamName,
        coordinator_id: coordinatorId,
      }),
    });
  } catch (err) {
    console.error('Push notification failed:', err);
  }
};

export const notifyPaymentStatusAPI = async (
  userId: string,
  eventTitle: string,
  amount: number,
  status: 'approved' | 'rejected',
  reason?: string
) => {
  try {
    const idToken = await getAuthToken();
    await fetch(`${getBackendUrl()}/api/notifications/payment-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({
        user_id: userId,
        event_title: eventTitle,
        amount,
        status,
        reason,
      }),
    });
  } catch (err) {
    console.error('Push notification failed:', err);
  }
};

export const notifyTeamInviteAPI = async (
  recipientId: string,
  teamName: string,
  leaderName: string
) => {
  try {
    const idToken = await getAuthToken();
    await fetch(`${getBackendUrl()}/api/notifications/team-invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({
        recipient_id: recipientId,
        team_name: teamName,
        leader_name: leaderName,
      }),
    });
  } catch (err) {
    console.error('Push notification failed:', err);
  }
};

export const notifyTeamInviteResponseAPI = async (
  leaderId: string,
  recipientName: string,
  teamName: string,
  accepted: boolean
) => {
  try {
    const idToken = await getAuthToken();
    await fetch(`${getBackendUrl()}/api/notifications/team-invite-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({
        leader_id: leaderId,
        recipient_name: recipientName,
        team_name: teamName,
        accepted,
      }),
    });
  } catch (err) {
    console.error('Push notification failed:', err);
  }
};

export const notifyTeamRegisteredAPI = async (
  memberIds: string[],
  eventTitle: string,
  teamName: string
) => {
  try {
    const idToken = await getAuthToken();
    await fetch(`${getBackendUrl()}/api/notifications/team-registered`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({
        member_ids: memberIds,
        event_title: eventTitle,
        team_name: teamName,
      }),
    });
  } catch (err) {
    console.error('Push notification failed:', err);
  }
};

// Generic push push logic to replace old internal mock
export const sendGenericPushNotificationAPI = async (
  recipientIds: string[],
  title: string,
  body: string,
  link?: string
) => {
  try {
    const idToken = await getAuthToken();
    await fetch(`${getBackendUrl()}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({
        recipient_ids: recipientIds,
        title,
        body,
        link,
      }),
    });
  } catch (err) {
    console.error('Push notification failed:', err);
  }
};
