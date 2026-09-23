// Firebase Configuration and Initialization
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  runTransaction,
  writeBatch,
  increment,
  serverTimestamp,
  orderBy,
  type DocumentData,
  Timestamp
} from 'firebase/firestore';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

export const DEPARTMENTS = [
  'AIML', 'AIDS', 'CSE', 'CSE(AI)', 'CSE(DS)', 
  'IT', 'ECE', 'EEE', 'BME', 'BI', 'CYBER SECURITY'
];

export type UserRole = 'student' | 'admin' | 'coordinator';
// Built-in suggestions; coordinators may also type their own category,
// so this is a loose string rather than a closed union.
export const EVENT_TYPE_PRESETS = ['Workshop', 'Seminar', 'Hackathon', 'Symposium', 'Bootcamp', 'Conference'] as const;
export type EventType = string;

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

let messaging: Messaging | null = null;
try {
  messaging = getMessaging(app);
} catch (err) {
  console.warn('FCM not supported in this environment:', err);
}

setPersistence(auth, browserLocalPersistence);

export const loginWithEmail = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const registerWithEmail = async (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const loginWithGoogle = async () => {
  return signInWithPopup(auth, googleProvider);
};

export const logout = async () => {
  return signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// ============================================
// USER FUNCTIONS
// ============================================

export const updateUserEmailField = async (uid: string, email: string) => {
  const cleanEmail = email.trim().toLowerCase();
  await updateDoc(doc(db, 'users', uid), { email: cleanEmail });
};

export const createUserDocument = async (
  uid: string,
  data: { name: string; reg_no: string; department: string; role: UserRole; email?: string }
) => {
  const userRef = doc(db, 'users', uid);
  const cleanEmail = (data.email || '').trim().toLowerCase();
  await setDoc(userRef, {
    ...data,
    email: cleanEmail,
    created_at: serverTimestamp()
  });
};

export const getUserDocument = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() };
  }
  return null;
};

export const updateUserRole = async (uid: string, role: UserRole) => {
  const userRef = doc(db, 'users', uid);
  return updateDoc(userRef, { role });
};

export const createOrUpdateUserDocument = async (
  uid: string,
  email: string,
  data: { name: string; reg_no?: string; department?: string; role?: UserRole }
) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  const cleanEmail = (email || '').trim().toLowerCase();
  const isAdminUser = cleanEmail === ADMIN_EMAIL.trim().toLowerCase();
  const role: UserRole = isAdminUser ? 'admin' : (data.role || 'student');

  if (userSnap.exists()) {
    const existing = userSnap.data();
    const updates: Record<string, any> = {};

    // Ensure email is always recorded in lowercase
    if (cleanEmail && (!existing.email || existing.email.toLowerCase() !== cleanEmail)) {
      updates.email = cleanEmail;
    }
    // Update name if default placeholder
    if (data.name && (!existing.name || existing.name === 'User' || existing.name === 'Student')) {
      updates.name = data.name;
    }
    if (isAdminUser && existing.role !== 'admin') {
      updates.role = 'admin';
    }
    if (Object.keys(updates).length > 0) {
      await updateDoc(userRef, updates);
    }
    return {
      id: userSnap.id,
      ...existing,
      ...updates,
      email: cleanEmail || existing.email,
      role: isAdminUser ? 'admin' : (existing.role || role)
    };
  } else {
    const userData = {
      name: data.name || 'Student',
      reg_no: data.reg_no || '',
      department: data.department || '',
      email: cleanEmail,
      role,
      created_at: serverTimestamp()
    };
    await setDoc(userRef, userData);
    return { id: uid, ...userData };
  }
};

export const checkRegNoExists = async (regNo: string): Promise<boolean> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('reg_no', '==', regNo));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

// ─── Block / Unblock a student ────────────────────────────────
export const blockUser = async (uid: string): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { is_blocked: true });
};

export const unblockUser = async (uid: string): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { is_blocked: false });
};

// ============================================
// EVENT/WORKSHOP FUNCTIONS
// ============================================

export interface EventLocation {
  address: string;
  lat?: number;
  lng?: number;
}

export interface EventTimelineItem {
  time: string;   // e.g. "09:00 AM"
  title: string;  // e.g. "Grand Opening Show"
}

// total_seats / available_seats are `null` to mean "unlimited seats — no cap"
export interface EventData {
  id?: string;
  title: string;
  type: EventType;
  about?: string;
  images?: string[];               // Cloudinary URLs
  location?: EventLocation;        // free-text address, optional lat/lng for the embedded map
  use_map?: boolean;                // show the interactive map picker / embed
  map_link?: string;                // manual Google Maps link, used by the "Locate" button
  date: string;
  start_time?: string;
  end_time?: string;
  registration_end_date?: string;   // custom registration deadline (defaults to event date/start_time if unset)
  registration_end_time?: string;
  total_seats: number | null;      // null = unlimited
  available_seats: number | null;  // null = unlimited
  registration_fee?: number;       // 0 = free
  status: 'Upcoming' | 'Closed';
  is_mandatory: boolean;
  target_branches: string[];
  timeline?: EventTimelineItem[];
  coordinator_id?: string;
  coordinator_name?: string;
  contact_name?: string;           // public-facing organizer name shown to students
  contact_phone?: string;          // public-facing organizer phone number
  team_based?: boolean;            // whether registration is per-team
  team_size?: number;              // max members allowed per team
  requires_email?: boolean;        // whether teammate emails must be collected
  external_form_url?: string;      // if set, registration happens on this external form instead
  sheet_webhook_url?: string;       // Google Apps Script Web App URL — new registrations get POSTed here
  sheet_view_url?: string;          // the actual spreadsheet link, opened by "View Registered Students"
  is_paid?: boolean;                // whether this event charges a fee
  upi_id?: string;                  // coordinator's UPI ID for the payment page
  payment_qr_image?: string;        // optional coordinator-provided QR (e.g. a business/bank QR)
  contact_phones?: string[];        // one or more contact numbers shown to students
  approval_status?: ApprovalStatus; // events are only shown to students once an admin approves
  rejection_reason?: string;
  enrolled_count?: number;          // aggregate: total individual participants enrolled
  team_count?: number;              // aggregate: number of teams enrolled
  certificate_template_url?: string; // coordinator/admin-uploaded template image
  certificate_name_position?: {      // where the participant's name is drawn on the template
    xPercent: number;                // 0-100, from the left
    yPercent: number;                // 0-100, from the top
    fontSize: number;                // px, at the template's native resolution
    color: string;                   // CSS color
    fontFamily?: string;             // e.g. 'Arial', 'Playfair Display' — see CERTIFICATE_FONTS
  };
  created_at?: Timestamp;
}

// Strips any `undefined` values before writing to Firestore, since
// addDoc()/updateDoc() throw on undefined (but null is fine).
const stripUndefined = <T extends Record<string, unknown>>(obj: T): T => {
  const clean = { ...obj };
  (Object.keys(clean) as (keyof T)[]).forEach((key) => {
    if (clean[key] === undefined) delete clean[key];
  });
  return clean;
};

export const createEvent = async (data: {
  title: string;
  type: EventType;
  about?: string;
  images?: string[];
  location?: EventLocation;
  use_map?: boolean;
  map_link?: string;
  date: string;
  start_time: string;
  end_time: string;
  registration_end_date?: string;
  registration_end_time?: string;
  total_seats: number | null;      // null = unlimited
  registration_fee?: number;
  is_mandatory: boolean;
  target_branches: string[];
  timeline?: EventTimelineItem[];
  coordinator_id?: string;
  coordinator_name?: string;
  contact_name?: string;
  contact_phone?: string;
  team_based?: boolean;
  team_size?: number;
  requires_email?: boolean;
  external_form_url?: string;
  sheet_webhook_url?: string;
  sheet_view_url?: string;
  is_paid?: boolean;
  upi_id?: string;
  payment_qr_image?: string;
  contact_phones?: string[];
  certificate_template_url?: string;
  certificate_name_position?: { xPercent: number; yPercent: number; fontSize: number; color: string; fontFamily?: string };
}) => {
  const eventsRef = collection(db, 'events');
  return addDoc(eventsRef, stripUndefined({
    ...data,
    available_seats: data.total_seats, // null stays null (unlimited)
    status: 'Upcoming',
    // Every new event waits for admin approval before students can see it.
    approval_status: 'pending' as ApprovalStatus,
    enrolled_count: 0,
    team_count: 0,
    created_at: serverTimestamp()
  }));
};

// Checks whether registration is still open for an event, based on its
// custom registration deadline (falling back to the event's own start
// time if no deadline was set).
export const isRegistrationClosed = (event: DocumentData): boolean => {
  const now = new Date();
  const dateStr = event.registration_end_date || event.date;
  const timeStr = event.registration_end_time || event.start_time || '23:59';
  if (!dateStr) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const deadline = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return now >= deadline;
};

export const updateEventStatus = async (eventId: string, status: 'Upcoming' | 'Closed') => {
  const eventRef = doc(db, 'events', eventId);
  return updateDoc(eventRef, { status });
};

export const updateEvent = async (eventId: string, data: Partial<EventData>) => {
  const eventRef = doc(db, 'events', eventId);
  // If total_seats is being changed, keep available_seats in sync when going
  // to/from unlimited. Preserve the existing enrolled count otherwise.
  const payload: Partial<EventData> = { ...data };
  if ('total_seats' in data) {
    if (data.total_seats === null) {
      payload.available_seats = null;
    } else if (payload.available_seats === undefined) {
      // Caller didn't explicitly set available_seats — re-derive it so a
      // seat-count edit doesn't silently reset who's already enrolled.
      const existing = await getDoc(eventRef);
      if (existing.exists()) {
        const prev = existing.data() as EventData;
        const prevTotal = prev.total_seats ?? 0;
        const prevAvailable = prev.available_seats ?? 0;
        const enrolled = prevTotal - prevAvailable;
        payload.available_seats = Math.max(0, (data.total_seats as number) - enrolled);
      } else {
        payload.available_seats = data.total_seats;
      }
    }
  }
  return updateDoc(eventRef, stripUndefined(payload));
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  const eventRef         = doc(db, 'events', eventId);
  const registrationsRef = collection(db, 'registrations');
  const waitlistRef      = collection(db, 'waitlist');

  const [regSnap, waitSnap] = await Promise.all([
    getDocs(query(registrationsRef, where('event_id', '==', eventId))),
    getDocs(query(waitlistRef,      where('event_id', '==', eventId))),
  ]);

  const allRefs = [
    ...regSnap.docs.map(d => d.ref),
    ...waitSnap.docs.map(d => d.ref),
    eventRef,
  ];

  const CHUNK = 499;
  for (let i = 0; i < allRefs.length; i += CHUNK) {
    await Promise.all(allRefs.slice(i, i + CHUNK).map(ref => deleteDoc(ref)));
  }
};

export const subscribeToEvents = (callback: (events: DocumentData[]) => void) => {
  const eventsRef = collection(db, 'events');
  const q = query(eventsRef, orderBy('date', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(events);
  });
};

// ── Read-efficient fetches ─────────────────────────────────
// The free Firestore tier bills per document read, and an onSnapshot
// listener re-reads the whole result set on every change. These one-shot
// getDocs versions are used wherever a live feed isn't actually needed
// (dashboards, admin lists), which cuts reads dramatically.

/** Students only ever see approved events, and the filter runs server-side
 *  so unapproved documents are never read/billed on the client. */
export const getApprovedEvents = async (): Promise<DocumentData[]> => {
  const eventsRef = collection(db, 'events');
  // Sorted client-side rather than with orderBy('date') in the query:
  // an equality filter (approval_status) combined with a sort on a
  // different field (date) needs a Firestore composite index, and this
  // avoids depending on one being deployed. The list is small enough
  // that sorting in JS costs nothing noticeable.
  const q = query(eventsRef, where('approval_status', '==', 'approved'));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => ((a as DocumentData).date < (b as DocumentData).date ? -1 : 1));
};

export const getAllEvents = async (): Promise<DocumentData[]> => {
  const eventsRef = collection(db, 'events');
  const q = query(eventsRef, orderBy('date', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getCoordinatorEvents = async (coordinatorId: string): Promise<DocumentData[]> => {
  const eventsRef = collection(db, 'events');
  const q = query(eventsRef, where('coordinator_id', '==', coordinatorId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getPendingEvents = async (): Promise<DocumentData[]> => {
  const eventsRef = collection(db, 'events');
  const q = query(eventsRef, where('approval_status', '==', 'pending'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const approveEvent = async (eventId: string) => {
  await updateDoc(doc(db, 'events', eventId), {
    approval_status: 'approved' as ApprovalStatus,
    rejection_reason: ''
  });
};

export const rejectEvent = async (eventId: string, reason = '') => {
  await updateDoc(doc(db, 'events', eventId), {
    approval_status: 'rejected' as ApprovalStatus,
    rejection_reason: reason
  });
};

// Deletes any event whose end time was more than `graceHours` ago. There's
// no server-side cron in this project, so this is called opportunistically
// from the admin panel (on load) to keep the events collection tidy —
// it's not a true background job.
export const deleteEndedEvents = async (graceHours = 24): Promise<number> => {
  const eventsRef = collection(db, 'events');
  const snapshot = await getDocs(eventsRef);
  const now = new Date();
  const toDelete: string[] = [];

  snapshot.docs.forEach(d => {
    const event = d.data();
    if (!event.date) return;
    const [year, month, day] = event.date.split('-').map(Number);
    const [hours, minutes] = (event.end_time || '23:59').split(':').map(Number);
    const endDT = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const graceDeadline = new Date(endDT.getTime() + graceHours * 60 * 60 * 1000);
    if (now >= graceDeadline) toDelete.push(d.id);
  });

  await Promise.all(toDelete.map(id => deleteEvent(id)));
  return toDelete.length;
};

export const getEventById = async (eventId: string): Promise<DocumentData | null> => {
  const eventSnap = await getDoc(doc(db, 'events', eventId));
  if (!eventSnap.exists()) return null;
  return { id: eventSnap.id, ...eventSnap.data() };
};

// ============================================
// COORDINATOR FUNCTIONS
// ============================================

export const subscribeToCoordinatorEvents = (
  coordinatorId: string,
  callback: (events: DocumentData[]) => void
) => {
  const eventsRef = collection(db, 'events');
  const q = query(eventsRef, where('coordinator_id', '==', coordinatorId));
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(events);
  });
};

// Live list of everyone registered for one event. Used by the coordinator
// and admin views to show who enrolled. Firestore rules restrict this to
// the event's own coordinator and to admins.
export const subscribeToEventRegistrations = (
  eventId: string,
  callback: (registrations: DocumentData[]) => void
) => {
  const registrationsRef = collection(db, 'registrations');
  const q = query(registrationsRef, where('event_id', '==', eventId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const getEventRegistrations = async (eventId: string): Promise<DocumentData[]> => {
  const registrationsRef = collection(db, 'registrations');
  const q = query(registrationsRef, where('event_id', '==', eventId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ============================================
// REGISTRATION FUNCTIONS
// ============================================

export const checkTimeConflict = async (
  userId: string,
  eventDate: string,
  startTime: string,
  endTime: string,
  excludeEventId?: string
): Promise<{ hasConflict: boolean; conflictingEvent?: string }> => {
  const registrationsRef = collection(db, 'registrations');
  const q = query(registrationsRef, where('user_id', '==', userId));
  const registrations = await getDocs(q);
  if (registrations.empty) return { hasConflict: false };

  // Filter out cancelled registrations - they don't block re-registration
  const activeRegistrations = registrations.docs.filter(doc => doc.data().status !== 'cancelled');
  const eventIds = activeRegistrations.map(doc => doc.data().event_id);

  for (const eventId of eventIds) {
    if (eventId === excludeEventId) continue;
    const eventDoc = await getDoc(doc(db, 'events', eventId));
    if (!eventDoc.exists()) continue;
    const event = eventDoc.data();
    if (event.date === eventDate) {
      const existingStart = event.start_time || '00:00';
      const existingEnd   = event.end_time   || '23:59';
      if (
        (startTime >= existingStart && startTime < existingEnd) ||
        (endTime > existingStart && endTime <= existingEnd) ||
        (startTime <= existingStart && endTime >= existingEnd)
      ) {
        return { hasConflict: true, conflictingEvent: event.title };
      }
    }
  }
  return { hasConflict: false };
};

export interface PaymentProof {
  utr: string;     // the UPI transaction reference the student receives after paying
  amount: number;
}

export const registerForEvent = async (
  userId: string,
  eventId: string,
  userDepartment: string,
  participant?: { name?: string; email?: string; reg_no?: string; department?: string },
  payment?: PaymentProof
) => {
  const eventRef         = doc(db, 'events', eventId);
  const userRef           = doc(db, 'users', userId);
  const registrationsRef = collection(db, 'registrations');
  const waitlistRef      = collection(db, 'waitlist');

  // ── Block check ──────────────────────────────────────────
  const userSnap = await getDoc(userRef);
  if (userSnap.exists() && userSnap.data().is_blocked === true) {
    throw new Error(
      'Your account has been blocked by the admin. You cannot register for workshops at this time. Please contact your administrator for assistance.'
    );
  }

  // Duplicate registration check — a cancelled registration doesn't count,
  // since soft-deleting on cancel keeps the doc around for the coordinator's
  // "Cancelled Students" list.
  const regQuery = query(registrationsRef, where('user_id', '==', userId), where('event_id', '==', eventId));
  const existingReg = await getDocs(regQuery);
  if (existingReg.docs.some(d => d.data().status !== 'cancelled')) {
    throw new Error('Already registered for this workshop');
  }

  // Duplicate waitlist check
  const waitlistQuery = query(waitlistRef, where('user_id', '==', userId), where('event_id', '==', eventId));
  const existingWaitlist = await getDocs(waitlistQuery);
  if (!existingWaitlist.empty) throw new Error('Already on the waitlist for this workshop');

  const eventDoc = await getDoc(eventRef);
  if (!eventDoc.exists()) throw new Error('Workshop does not exist');
  const eventData = eventDoc.data();

  // Registration deadline check
  if (isRegistrationClosed(eventData)) {
    throw new Error('Registration for this event has closed');
  }

  // Branch eligibility
  if (eventData.target_branches && eventData.target_branches.length > 0) {
    if (!eventData.target_branches.includes(userDepartment)) {
      throw new Error('This workshop is not available for your department');
    }
  }

  // Time conflict check
  const conflictResult = await checkTimeConflict(
    userId,
    eventData.date,
    eventData.start_time || '00:00',
    eventData.end_time   || '23:59'
  );
  if (conflictResult.hasConflict) {
    throw new Error(`Time conflict with: ${conflictResult.conflictingEvent}`);
  }

  if (eventData.is_paid && !payment) {
    throw new Error('This event requires payment before you can register.');
  }

  // Only the display name is kept in Firestore — it's what the ticket
  // and the coordinator's QR check-in screen need to show. Email, reg no
  // and department are not duplicated here; they live in the
  // coordinator's Google Sheet (see logRegistrationToSheet) so the free
  // Firestore tier isn't filled with data the app itself never needs to
  // query or filter on.
  //
  // Paid events: the seat is reserved immediately (so it can't be double
  // sold) but the registration sits as 'pending_verification' — the
  // ticket/QR only becomes usable once a coordinator or admin manually
  // confirms the UPI transaction reference against their own bank/UPI
  // app. There is no way to verify a UPI payment automatically without a
  // real payment gateway, so this manual step is unavoidable on the free
  // tier.
  const participantFields = stripUndefined({
    participant_name: participant?.name,
    payment_status: eventData.is_paid ? ('pending_verification' as const) : undefined,
    payment_utr: payment?.utr,
    payment_amount: payment?.amount,
  });

  // ── Unlimited-seat events skip the transaction/seat-decrement entirely ──
  // (available_seats === null means "no cap")
  if (eventData.available_seats === null || eventData.total_seats === null) {
    const newRegRef = doc(registrationsRef);
    await setDoc(newRegRef, {
      user_id: userId,
      event_id: eventId,
      timestamp: serverTimestamp(),
      status: 'confirmed',
      ...participantFields
    });
    await updateDoc(eventRef, { enrolled_count: increment(1) });
    return { status: 'registered' as const, message: 'Successfully registered!', registrationId: newRegRef.id };
  }

  return runTransaction(db, async (transaction) => {
    const freshEvent = await transaction.get(eventRef);
    if (!freshEvent.exists()) throw new Error('Workshop does not exist');
    const freshData = freshEvent.data();

    // Re-check in case the event was switched to unlimited between the
    // read above and the transaction starting.
    if (freshData.available_seats === null || freshData.total_seats === null) {
      const newRegRef = doc(registrationsRef);
      transaction.set(newRegRef, {
        user_id: userId,
        event_id: eventId,
        timestamp: serverTimestamp(),
        status: 'confirmed',
        ...participantFields
      });
      transaction.update(eventRef, { enrolled_count: increment(1) });
      return { status: 'registered' as const, message: 'Successfully registered!', registrationId: newRegRef.id };
    }

    if (freshData.available_seats > 0) {
      transaction.update(eventRef, {
        available_seats: freshData.available_seats - 1,
        enrolled_count: increment(1)
      });
      const newRegRef = doc(registrationsRef);
      transaction.set(newRegRef, {
        user_id: userId,
        event_id: eventId,
        timestamp: serverTimestamp(),
        status: 'confirmed',
        ...participantFields
      });
      return { status: 'registered' as const, message: 'Successfully registered!', registrationId: newRegRef.id };
    } else {
      const waitlistCount = await getDocs(query(waitlistRef, where('event_id', '==', eventId)));
      const newWaitlistRef = doc(waitlistRef);
      transaction.set(newWaitlistRef, {
        user_id: userId,
        event_id: eventId,
        position: waitlistCount.size + 1,
        timestamp: serverTimestamp(),
        status: 'waiting'
      });
      return { status: 'waitlisted' as const, message: 'Added to waitlist!', registrationId: undefined };
    }
  });
};

// ── Team registration ──────────────────────────────────────
// Registers a whole team in one go. The signed-in student is always
// the "leader" (their uid owns every doc, per Firestore rules), but a
// separate registration document — and therefore a separate ticket —
// is created for every member, including the leader.
//
// Note: unlike solo registration, a team that doesn't fully fit in the
// remaining seats is rejected outright rather than partially seated or
// waitlisted — there's no well-defined way to "half enroll" a team.
// Short, human-typeable code an event's teammates can enter instead of
// clicking a link. Excludes visually-ambiguous characters (0/O, 1/I/L).
const generateJoinCode = (): string => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

export const registerTeamForEvent = async (
  leaderId: string,
  eventId: string,
  userDepartment: string,
  teamName: string,
  members: { name: string; email?: string; uid?: string; reg_no?: string; department?: string }[], // includes the leader as members[0]
  payment?: PaymentProof
) => {
  const eventRef         = doc(db, 'events', eventId);
  const userRef           = doc(db, 'users', leaderId);
  const registrationsRef = collection(db, 'registrations');

  if (members.length < 1) throw new Error('A team needs at least one member');

  // ── Block check ──────────────────────────────────────────
  const userSnap = await getDoc(userRef);
  if (userSnap.exists() && userSnap.data().is_blocked === true) {
    throw new Error(
      'Your account has been blocked by the admin. You cannot register for workshops at this time. Please contact your administrator for assistance.'
    );
  }

  // Duplicate registration check (leader already registered/leading a team here?)
  // A cancelled registration doesn't block re-registering.
  const regQuery = query(registrationsRef, where('user_id', '==', leaderId), where('event_id', '==', eventId));
  const existingReg = await getDocs(regQuery);
  if (existingReg.docs.some(d => d.data().status !== 'cancelled')) {
    throw new Error('You have already registered for this workshop');
  }

  const eventDoc = await getDoc(eventRef);
  if (!eventDoc.exists()) throw new Error('Workshop does not exist');
  const eventData = eventDoc.data();

  if (isRegistrationClosed(eventData)) {
    throw new Error('Registration for this event has closed');
  }

  if (eventData.team_size && members.length > eventData.team_size) {
    throw new Error(`Teams for this event can have at most ${eventData.team_size} members`);
  }

  if (eventData.target_branches && eventData.target_branches.length > 0) {
    if (!eventData.target_branches.includes(userDepartment)) {
      throw new Error('This workshop is not available for your department');
    }
  }

  const conflictResult = await checkTimeConflict(
    leaderId,
    eventData.date,
    eventData.start_time || '00:00',
    eventData.end_time   || '23:59'
  );
  if (conflictResult.hasConflict) {
    throw new Error(`Time conflict with: ${conflictResult.conflictingEvent}`);
  }

  if (eventData.is_paid && !payment) {
    throw new Error('This event requires payment before you can register.');
  }

  const teamId = doc(registrationsRef).id; // used to link every member's ticket together
  const registrationIds: string[] = [];

  // A small, separately-readable doc so a teammate who isn't registered
  // yet — and therefore isn't allowed to read registration documents —
  // can still look up the team name and remaining capacity from an
  // invite link (see getTeamDoc / joinTeamAsMember).
  const teamDocRef = doc(db, 'teams', teamId);

  const buildDoc = (member: { name: string; email?: string; uid?: string }, isLeader: boolean) => stripUndefined({
    user_id: member.uid || leaderId,
    booked_by: leaderId,
    event_id: eventId,
    timestamp: serverTimestamp(),
    status: 'confirmed' as const,
    team_id: teamId,
    team_name: teamName,
    is_leader: isLeader,
    participant_name: member.name,
    // Payment (if required) is collected once, from the leader, and
    // applies to the whole team's registration in this initial batch.
    payment_status: eventData.is_paid ? ('pending_verification' as const) : undefined,
    payment_utr: isLeader ? payment?.utr : undefined,
    payment_amount: isLeader ? payment?.amount : undefined,
  });

  const notifyTeammates = () => {
    members.forEach((m, idx) => {
      if (m.uid && m.uid !== leaderId) {
        createNotification(
          m.uid,
          'Team Event Ticket Ready 🎟️',
          `Your team leader ${members[0]?.name || 'Leader'} registered you for "${eventData.title}" in team "${teamName}".`,
          `/ticket/${registrationIds[idx]}`
        );
      }
    });
  };

  const isUnlimited = eventData.available_seats === null || eventData.total_seats === null;

  if (isUnlimited) {
    const batch = writeBatch(db);
    members.forEach((member, i) => {
      const ref = doc(registrationsRef);
      registrationIds.push(ref.id);
      batch.set(ref, buildDoc(member, i === 0));
    });
    batch.update(eventRef, {
      enrolled_count: increment(members.length),
      team_count: increment(1)
    });
    const joinCode = generateJoinCode();
    batch.set(teamDocRef, {
      event_id: eventId,
      team_name: teamName,
      leader_name: members[0]?.name || '',
      member_count: members.length,
      max_size: eventData.team_size || members.length,
      join_code: joinCode,
      created_at: serverTimestamp(),
    });
    await batch.commit();
    notifyTeammates();
    return { status: 'registered' as const, message: 'Team successfully registered!', teamId, registrationIds };
  }

  await runTransaction(db, async (transaction) => {
    const freshEvent = await transaction.get(eventRef);
    if (!freshEvent.exists()) throw new Error('Workshop does not exist');
    const freshData = freshEvent.data();

    const stillUnlimited = freshData.available_seats === null || freshData.total_seats === null;
    if (!stillUnlimited) {
      if ((freshData.available_seats ?? 0) < members.length) {
        throw new Error(
          `Not enough seats left for your whole team (${members.length} needed, ${freshData.available_seats ?? 0} available). Ask teammates to check back later, or reduce your team size.`
        );
      }
      transaction.update(eventRef, {
        available_seats: freshData.available_seats - members.length,
        enrolled_count: increment(members.length),
        team_count: increment(1)
      });
    } else {
      transaction.update(eventRef, {
        enrolled_count: increment(members.length),
        team_count: increment(1)
      });
    }

    members.forEach((member, i) => {
      const ref = doc(registrationsRef);
      registrationIds.push(ref.id);
      transaction.set(ref, buildDoc(member, i === 0));
    });

    transaction.set(teamDocRef, {
      event_id: eventId,
      team_name: teamName,
      leader_name: members[0]?.name || '',
      member_count: members.length,
      max_size: eventData.team_size || members.length,
      join_code: generateJoinCode(),
      created_at: serverTimestamp(),
    });
  });

  notifyTeammates();
  return { status: 'registered' as const, message: 'Team successfully registered!', teamId, registrationIds };
};

// ── Team invite links ────────────────────────────────────────
// Anyone signed in can read a team doc (it holds nothing sensitive — just
// a name and a headcount), which is what lets someone who clicks an
// invite link see the team name before they've registered for anything.
export interface TeamInfo {
  id: string;
  event_id: string;
  team_name: string;
  leader_name: string;
  member_count: number;
  max_size: number;
  join_code?: string;
}

export const getTeamDoc = async (teamId: string): Promise<TeamInfo | null> => {
  const snap = await getDoc(doc(db, 'teams', teamId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as TeamInfo;
};

// Looks a team up by its short join code instead of the full Firestore ID
// — lets a teammate type a code in by hand rather than needing the link.
// Scoped to one event since codes are only unique within that scope.
export const getTeamByCode = async (eventId: string, code: string): Promise<TeamInfo | null> => {
  const teamsRef = collection(db, 'teams');
  const q = query(teamsRef, where('event_id', '==', eventId), where('join_code', '==', code.trim().toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as TeamInfo;
};

// Adds one more person to an existing team, via the invite link flow.
// Unlike registerTeamForEvent (which creates the team), this only ever
// adds a single member and never collects payment again — if the event
// is paid, each joining teammate pays their own share independently.
export const joinTeamAsMember = async (
  teamId: string,
  userId: string,
  userDepartment: string,
  participantName: string,
  payment?: PaymentProof
) => {
  const teamDocRef = doc(db, 'teams', teamId);
  const registrationsRef = collection(db, 'registrations');
  const userRef = doc(db, 'users', userId);

  const userSnap = await getDoc(userRef);
  if (userSnap.exists() && userSnap.data().is_blocked === true) {
    throw new Error('Your account has been blocked by the admin.');
  }

  const teamSnap = await getDoc(teamDocRef);
  if (!teamSnap.exists()) throw new Error('This invite link is no longer valid.');
  const team = teamSnap.data() as TeamInfo;

  const eventRef = doc(db, 'events', team.event_id);
  const eventDoc = await getDoc(eventRef);
  if (!eventDoc.exists()) throw new Error('This event no longer exists.');
  const eventData = eventDoc.data();

  if (isRegistrationClosed(eventData)) throw new Error('Registration for this event has closed.');
  if (eventData.target_branches?.length > 0 && !eventData.target_branches.includes(userDepartment)) {
    throw new Error('This event is not open to your department.');
  }
  if (eventData.is_paid && !payment) {
    throw new Error('This event requires payment before you can join.');
  }

  const existing = await getDocs(query(
    registrationsRef, where('user_id', '==', userId), where('event_id', '==', team.event_id)
  ));
  if (existing.docs.some(d => d.data().status !== 'cancelled')) {
    throw new Error("You're already registered for this event.");
  }

  const conflictResult = await checkTimeConflict(
    userId, eventData.date, eventData.start_time || '00:00', eventData.end_time || '23:59'
  );
  if (conflictResult.hasConflict) throw new Error(`Time conflict with: ${conflictResult.conflictingEvent}`);

  const newRegRef = doc(registrationsRef);

  await runTransaction(db, async (transaction) => {
    const freshTeam = await transaction.get(teamDocRef);
    const freshEvent = await transaction.get(eventRef);
    if (!freshTeam.exists()) throw new Error('This invite link is no longer valid.');
    if (!freshEvent.exists()) throw new Error('This event no longer exists.');

    const teamData = freshTeam.data() as TeamInfo;
    if (teamData.member_count >= teamData.max_size) {
      throw new Error('This team is already full.');
    }

    const freshEventData = freshEvent.data();
    const unlimited = freshEventData.available_seats === null || freshEventData.total_seats === null;
    if (!unlimited) {
      if ((freshEventData.available_seats ?? 0) < 1) {
        throw new Error('No seats left for this event.');
      }
      transaction.update(eventRef, { available_seats: freshEventData.available_seats - 1, enrolled_count: increment(1) });
    } else {
      transaction.update(eventRef, { enrolled_count: increment(1) });
    }

    transaction.update(teamDocRef, { member_count: increment(1) });

    transaction.set(newRegRef, stripUndefined({
      user_id: userId,
      event_id: team.event_id,
      timestamp: serverTimestamp(),
      status: 'confirmed',
      team_id: teamId,
      team_name: team.team_name,
      is_leader: false,
      participant_name: participantName,
      payment_status: freshEventData.is_paid ? 'pending_verification' as const : undefined,
      payment_utr: payment?.utr,
      payment_amount: payment?.amount,
    }));
  });

  return { registrationId: newRegRef.id, eventId: team.event_id };
};

// Firestore rules require every document a query can return to be
// provably owned by the caller (resource.data.user_id == request.auth.uid),
// so this must filter on user_id too — a team_id-only query would be
// rejected outright since Firestore can't prove it's scoped safely.
// ── Payment verification (manual — see the note on registerForEvent) ──
export const getPendingPayments = async (eventId: string): Promise<DocumentData[]> => {
  const registrationsRef = collection(db, 'registrations');
  const q = query(
    registrationsRef,
    where('event_id', '==', eventId),
    where('payment_status', '==', 'pending_verification')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const verifyPayment = async (registrationId: string): Promise<void> => {
  await updateDoc(doc(db, 'registrations', registrationId), { payment_status: 'verified' });
};

// Rejecting a payment also releases the seat it was holding, since the
// registration never actually completed.
export const rejectPayment = async (registrationId: string, reason = ''): Promise<void> => {
  const regRef = doc(db, 'registrations', registrationId);
  await runTransaction(db, async (transaction) => {
    const regSnap = await transaction.get(regRef);
    if (!regSnap.exists()) throw new Error('Registration not found');
    const reg = regSnap.data();

    const eventRef = doc(db, 'events', reg.event_id);
    const eventSnap = await transaction.get(eventRef);

    transaction.update(regRef, { payment_status: 'rejected', payment_rejection_reason: reason });

    if (eventSnap.exists()) {
      const eventData = eventSnap.data();
      const unlimited = eventData.available_seats === null || eventData.total_seats === null;
      transaction.update(eventRef, stripUndefined({
        available_seats: unlimited ? undefined : (eventData.available_seats ?? 0) + 1,
        enrolled_count: increment(-1),
        team_count: reg.is_leader ? increment(-1) : undefined,
      }));
    }
  });
};

// ── Attendance (marked by scanning the ticket's QR code) ──────
export const markAttendance = async (registrationId: string): Promise<DocumentData> => {
  const regRef = doc(db, 'registrations', registrationId);
  const regSnap = await getDoc(regRef);
  if (!regSnap.exists()) throw new Error('No registration found for this QR code.');
  const reg = regSnap.data();

  if (reg.status === 'cancelled') {
    throw new Error('This registration was cancelled — it cannot be checked in.');
  }
  if (reg.payment_status === 'pending_verification') {
    throw new Error('This registration is still awaiting payment verification.');
  }
  if (reg.payment_status === 'rejected') {
    throw new Error('This registration\'s payment was rejected.');
  }
  if (reg.attended) {
    return { id: regSnap.id, ...reg, alreadyMarked: true };
  }

  await updateDoc(regRef, { attended: true, attended_at: serverTimestamp() });
  return { id: regSnap.id, ...reg, attended: true, alreadyMarked: false };
};

// ── In-app notifications ─────────────────────────────────────
// Replaces email entirely — Gmail's free daily quota and the CORS
// limitations of Apps Script made it unreliable, and this needs no
// external service at all. A notification is just a Firestore doc
// pointing at whoever should see it, with an optional `link` the
// notification bell navigates to when clicked.
export interface AppNotification {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at?: Timestamp;
}

export const createNotification = async (
  recipientId: string,
  title: string,
  message: string,
  link?: string
) => {
  const notificationsRef = collection(db, 'notifications');
  await addDoc(notificationsRef, stripUndefined({
    recipient_id: recipientId,
    title,
    message,
    link,
    read: false,
    created_at: serverTimestamp(),
  }));
  // Attempt real device push
  await sendPushNotification(recipientId, title, message);
};

export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: AppNotification[]) => void
) => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(notificationsRef, where('recipient_id', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() } as AppNotification))
      // Newest first — sorted client-side so this doesn't need a composite
      // index (recipient_id equality + created_at order).
      .sort((a, b) => {
        const aTime = a.created_at?.toMillis?.() ?? 0;
        const bTime = b.created_at?.toMillis?.() ?? 0;
        return bTime - aTime;
      });
    callback(notifications);
  });
};

export const markNotificationRead = async (notificationId: string) => {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
};

export const markAllNotificationsRead = async (userId: string) => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(notificationsRef, where('recipient_id', '==', userId), where('read', '==', false));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map(d => updateDoc(d.ref, { read: true })));
};

export const getRegistrationsByTeam = async (teamId: string, callerUid: string): Promise<DocumentData[]> => {
  const registrationsRef = collection(db, 'registrations');
  const q = query(registrationsRef, where('team_id', '==', teamId), where('user_id', '==', callerUid));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => (b as DocumentData).is_leader === true ? 1 : (a as DocumentData).is_leader === true ? -1 : 0);
};

// ── Google Sheet logging (optional, per-event) ──────────────
// Fires a registration's details at the coordinator's Apps Script Web
// App so it lands as a new row in their Google Sheet. This is
// best-effort only: Apps Script Web Apps don't return CORS headers a
// browser can read, so we send with mode: 'no-cors' and never know
// whether it actually succeeded. It must never throw or block
// registration — callers should fire this after the real Firestore
// write succeeds and swallow any error.
export interface SheetLogPayload {
  // 'register' (default if omitted) appends a new row.
  // 'attendance' finds the existing row by registration_id and ticks it.
  action?: 'register' | 'attendance';
  event_title: string;
  event_id: string;
  registration_id: string;
  participant_name: string;
  // Every field below is sent as an explicit empty string rather than
  // left out when unknown — JSON.stringify() silently DROPS object keys
  // whose value is `undefined`, so an omitted key here would arrive at
  // Apps Script as `undefined` and render as a blank cell with no way to
  // tell "blank because empty" apart from "blank because the key never
  // arrived". Sending '' for every field keeps that failure mode visible
  // and consistent instead of silently disappearing.
  participant_email: string;
  reg_no: string;
  department: string;
  team_name: string;
  team_id: string;
  is_leader: boolean;
  payment_status: string;
  payment_utr: string;
  payment_amount: string;
  registered_at: string; // ISO timestamp, since serverTimestamp() can't be read back immediately
}

export const logRegistrationToSheet = async (
  webhookUrl: string,
  payload: Partial<SheetLogPayload> & Pick<SheetLogPayload, 'event_title' | 'event_id' | 'registration_id' | 'participant_name' | 'registered_at'>
): Promise<void> => {
  // Fill in every optional field explicitly so no key is ever dropped by
  // JSON.stringify() (see the comment on SheetLogPayload above).
  const fullPayload: SheetLogPayload = {
    action: payload.action || 'register',
    event_title: payload.event_title,
    event_id: payload.event_id,
    registration_id: payload.registration_id,
    participant_name: payload.participant_name,
    participant_email: payload.participant_email || '',
    reg_no: payload.reg_no || '',
    department: payload.department || '',
    team_name: payload.team_name || '',
    team_id: payload.team_id || '',
    is_leader: !!payload.is_leader,
    payment_status: payload.payment_status || '',
    payment_utr: payload.payment_utr || '',
    payment_amount: payload.payment_amount != null ? String(payload.payment_amount) : '',
    registered_at: payload.registered_at,
  };
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors', // can't read the response, but the request still goes through
      headers: { 'Content-Type': 'text/plain' }, // avoids a CORS preflight, which no-cors Apps Script calls can't satisfy
      body: JSON.stringify(fullPayload),
    });
  } catch (err) {
    // Never let a broken sheet webhook affect the student's registration.
    console.warn('Could not log registration to Google Sheet:', err);
  }
};

export const cancelRegistration = async (userId: string, eventId: string) => {
  const eventRef         = doc(db, 'events', eventId);
  const registrationsRef = collection(db, 'registrations');
  const waitlistRef      = collection(db, 'waitlist');

  const regQuery    = query(registrationsRef, where('user_id', '==', userId), where('event_id', '==', eventId));
  const regSnapshotRaw = await getDocs(regQuery);
  // A user can cancel and later re-register for the same event, leaving an
  // old cancelled doc alongside a new active one — only the active one(s)
  // should ever be touched here.
  const activeDocs = regSnapshotRaw.docs.filter(d => d.data().status !== 'cancelled');

  if (activeDocs.length === 0) {
    const waitlistQuery    = query(waitlistRef, where('user_id', '==', userId), where('event_id', '==', eventId));
    const waitlistSnapshot = await getDocs(waitlistQuery);
    if (!waitlistSnapshot.empty) {
      await deleteDoc(waitlistSnapshot.docs[0].ref);
      return { status: 'removed_from_waitlist' };
    }
    throw new Error('Registration not found');
  }

  // A team registration produces one doc per member sharing the same
  // team_id — cancelling means removing every one of them and freeing
  // up that many seats at once. A solo registration is just one doc.
  const teamDocs = activeDocs;
  const seatsToFree = teamDocs.length;

  // Unlimited-seat events: just remove the registration(s), nothing to free up.
  const eventSnapForCancel = await getDoc(eventRef);
  const eventDataForCancel = eventSnapForCancel.exists() ? eventSnapForCancel.data() : null;
  const wasTeam = teamDocs.some(d => d.data().team_id);

  if (eventDataForCancel && (eventDataForCancel.available_seats === null || eventDataForCancel.total_seats === null)) {
    // Soft-delete: keep the doc (marked cancelled) rather than removing it,
    // so it still shows up in the coordinator's "Cancelled Students" list
    // instead of vanishing without a trace.
    await Promise.all(teamDocs.map(d => updateDoc(d.ref, { status: 'cancelled', cancelled_at: serverTimestamp() })));
    await updateDoc(eventRef, stripUndefined({
      enrolled_count: increment(-seatsToFree),
      team_count: wasTeam ? increment(-1) : undefined
    }));
    return { status: 'cancelled' };
  }

  // Team registrations don't participate in the individual waitlist
  // promotion flow — just free the seats back up.
  if (seatsToFree > 1) {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) throw new Error('Workshop does not exist');
      const eventData = eventDoc.data();
      teamDocs.forEach(d => transaction.update(d.ref, { status: 'cancelled', cancelled_at: serverTimestamp() }));
      transaction.update(eventRef, stripUndefined({
        available_seats: (eventData.available_seats ?? 0) + seatsToFree,
        enrolled_count: increment(-seatsToFree),
        team_count: wasTeam ? increment(-1) : undefined
      }));
    });
    return { status: 'cancelled' };
  }

  const registrationDoc = teamDocs[0];

  const waitlistQuery    = query(waitlistRef, where('event_id', '==', eventId));
  const waitlistSnapshot = await getDocs(waitlistQuery);
  const sortedWaitlist   = waitlistSnapshot.docs.sort((a, b) => (a.data().position || 0) - (b.data().position || 0));
  const nextInLine       = sortedWaitlist.length > 0 ? sortedWaitlist[0] : null;

  return runTransaction(db, async (transaction) => {
    const eventDoc = await transaction.get(eventRef);
    if (!eventDoc.exists()) throw new Error('Workshop does not exist');
    const eventData = eventDoc.data();

    transaction.update(registrationDoc.ref, { status: 'cancelled', cancelled_at: serverTimestamp() });

    if (nextInLine) {
      const nextUserId = nextInLine.data().user_id;
      const newRegRef  = doc(registrationsRef);
      transaction.set(newRegRef, {
        user_id: nextUserId,
        event_id: eventId,
        timestamp: serverTimestamp(),
        status: 'confirmed',
        promoted_from_waitlist: true
      });
      transaction.delete(nextInLine.ref);
      // Seat count is unchanged: the freed seat immediately goes to the
      // next person on the waitlist, so enrolled_count stays the same.
      return { status: 'cancelled_and_promoted', promotedUserId: nextUserId };
    } else {
      transaction.update(eventRef, {
        available_seats: (eventData.available_seats ?? 0) + 1,
        enrolled_count: increment(-1)
      });
      return { status: 'cancelled' };
    }
  });
};

export const checkRegistration = async (userId: string, eventId: string): Promise<boolean> => {
  const registrationsRef = collection(db, 'registrations');
  const q = query(registrationsRef, where('user_id', '==', userId), where('event_id', '==', eventId));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

export const getRegistrationById = async (registrationId: string): Promise<DocumentData | null> => {
  const regSnap = await getDoc(doc(db, 'registrations', registrationId));
  if (!regSnap.exists()) return null;
  return { id: regSnap.id, ...regSnap.data() };
};

export const checkWaitlist = async (userId: string, eventId: string): Promise<{ onWaitlist: boolean; position?: number }> => {
  const waitlistRef = collection(db, 'waitlist');
  const q = query(waitlistRef, where('user_id', '==', userId), where('event_id', '==', eventId));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return { onWaitlist: false };
  return { onWaitlist: true, position: querySnapshot.docs[0].data().position };
};

export const getUserRegistrations = async (userId: string) => {
  const registrationsRef = collection(db, 'registrations');
  const q = query(registrationsRef, where('user_id', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getUserWaitlist = async (userId: string) => {
  const waitlistRef = collection(db, 'waitlist');
  const q = query(waitlistRef, where('user_id', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// ============================================
// ADMIN FUNCTIONS
// ============================================

export const getAllUsers = async () => {
  const usersRef = collection(db, 'users');
  const querySnapshot = await getDocs(usersRef);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAllRegistrations = async () => {
  const registrationsRef = collection(db, 'registrations');
  const querySnapshot = await getDocs(registrationsRef);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const subscribeToRegistrations = (callback: (registrations: DocumentData[]) => void) => {
  const registrationsRef = collection(db, 'registrations');
  return onSnapshot(registrationsRef, (snapshot) => {
    const registrations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(registrations);
  });
};

export const subscribeToWaitlist = (callback: (waitlist: DocumentData[]) => void) => {
  const waitlistRef = collection(db, 'waitlist');
  return onSnapshot(waitlistRef, (snapshot) => {
    const waitlist = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(waitlist);
  });
};

export const subscribeToUsers = (callback: (users: DocumentData[]) => void) => {
  const usersRef = collection(db, 'users');
  return onSnapshot(usersRef, (snapshot) => {
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(users);
  });
};

// ============================================
// ANALYTICS FUNCTIONS
// ============================================

export interface EventAnalytics {
  eventId: string;
  title: string;
  type: string;
  date: string;
  totalSeats: number | null;   // null = unlimited
  enrolledCount: number;
  waitlistCount: number;
  utilizationPercent: number | null; // null = not applicable (unlimited)
  demandLevel: 'High' | 'Medium' | 'Low';
  isMandatory: boolean;
}

export const getEventAnalytics = async (): Promise<EventAnalytics[]> => {
  const eventsRef        = collection(db, 'events');
  const registrationsRef = collection(db, 'registrations');
  const waitlistRef      = collection(db, 'waitlist');

  const [eventsSnap, regsSnap, waitlistSnap] = await Promise.all([
    getDocs(eventsRef),
    getDocs(registrationsRef),
    getDocs(waitlistRef)
  ]);

  const registrationsByEvent: Record<string, number> = {};
  const waitlistByEvent: Record<string, number>      = {};

  regsSnap.docs.forEach(doc => {
    const data = doc.data();
    // Only count non-cancelled registrations
    if (data.status !== 'cancelled') {
      const eventId = data.event_id;
      registrationsByEvent[eventId] = (registrationsByEvent[eventId] || 0) + 1;
    }
  });
  waitlistSnap.docs.forEach(doc => {
    const eventId = doc.data().event_id;
    waitlistByEvent[eventId] = (waitlistByEvent[eventId] || 0) + 1;
  });

  return eventsSnap.docs.map(doc => {
    const event            = doc.data();
    const enrolledCount    = registrationsByEvent[doc.id] || 0;
    const waitlistCount    = waitlistByEvent[doc.id] || 0;
    const isUnlimited      = event.total_seats === null || event.total_seats === undefined;
    const utilizationPercent = isUnlimited
      ? null
      : event.total_seats > 0
        ? Math.round((enrolledCount / event.total_seats) * 100)
        : 0;

    let demandLevel: 'High' | 'Medium' | 'Low' = 'Low';
    if (isUnlimited) {
      // For unlimited events, judge demand purely on raw signups.
      if (enrolledCount >= 100) demandLevel = 'High';
      else if (enrolledCount >= 30) demandLevel = 'Medium';
    } else {
      if ((utilizationPercent as number) >= 80 || waitlistCount > 0) demandLevel = 'High';
      else if ((utilizationPercent as number) >= 50) demandLevel = 'Medium';
    }

    return {
      eventId: doc.id,
      title: event.title,
      type: event.type,
      date: event.date,
      totalSeats: isUnlimited ? null : event.total_seats,
      enrolledCount,
      waitlistCount,
      utilizationPercent,
      demandLevel,
      isMandatory: event.is_mandatory || false
    };
  });
};

// ============================================
// REVENUE CALCULATION
// ============================================

export interface RevenueData {
  totalRevenue: number;
  verifiedRevenue: number;
  pendingRevenue: number;
  eventBreakdown: {
    eventId: string;
    eventTitle: string;
    totalRevenue: number;
    verifiedRevenue: number;
    pendingRevenue: number;
    participantCount: number;
  }[];
}

/** Calculate total revenue from paid events for a coordinator or all events (admin) */
export const calculateRevenue = async (coordinatorId?: string): Promise<RevenueData> => {
  const eventsRef = collection(db, 'events');
  const registrationsRef = collection(db, 'registrations');

  let eventsQuery;
  if (coordinatorId) {
    eventsQuery = query(eventsRef, where('coordinator_id', '==', coordinatorId), where('is_paid', '==', true));
  } else {
    eventsQuery = query(eventsRef, where('is_paid', '==', true));
  }

  const [eventsSnap, allRegsSnap] = await Promise.all([
    getDocs(eventsQuery),
    getDocs(registrationsRef)
  ]);

  const events = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  let totalRevenue = 0;
  let verifiedRevenue = 0;
  let pendingRevenue = 0;
  const eventBreakdown: RevenueData['eventBreakdown'] = [];

  for (const event of events) {
    const eventRegs = allRegsSnap.docs
      .filter(d => {
        const data = d.data();
        return data.event_id === event.id && data.status !== 'cancelled';
      });

    let eventTotal = 0;
    let eventVerified = 0;
    let eventPending = 0;

    eventRegs.forEach(regDoc => {
      const reg = regDoc.data();
      const amount = reg.payment_amount || event.registration_fee || 0;

      if (reg.payment_status === 'verified') {
        eventVerified += amount;
      } else if (reg.payment_status === 'pending_verification') {
        eventPending += amount;
      }
      eventTotal += amount;
    });

    totalRevenue += eventTotal;
    verifiedRevenue += eventVerified;
    pendingRevenue += eventPending;

    if (eventRegs.length > 0) {
      eventBreakdown.push({
        eventId: event.id,
        eventTitle: event.title,
        totalRevenue: eventTotal,
        verifiedRevenue: eventVerified,
        pendingRevenue: eventPending,
        participantCount: eventRegs.length,
      });
    }
  }

  return {
    totalRevenue,
    verifiedRevenue,
    pendingRevenue,
    eventBreakdown,
  };
};

export const getUserByEmail = async (email: string) => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return null;
  const usersRef = collection(db, 'users');

  // 1. Try lowercase indexed search
  const q = query(usersRef, where('email', '==', cleanEmail));
  const snap = await getDocs(q);
  if (!snap.empty) {
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as DocumentData & { id: string };
  }

  // 2. Try raw casing search
  const qRaw = query(usersRef, where('email', '==', email.trim()));
  const snapRaw = await getDocs(qRaw);
  if (!snapRaw.empty) {
    return { id: snapRaw.docs[0].id, ...snapRaw.docs[0].data() } as DocumentData & { id: string };
  }

  // 3. Fallback: full collection scan with case-insensitive compare (handles legacy records)
  try {
    const allUsersSnap = await getDocs(usersRef);
    const found = allUsersSnap.docs.find((d) => {
      const uEmail = d.data().email;
      return typeof uEmail === 'string' && uEmail.trim().toLowerCase() === cleanEmail;
    });
    if (found) {
      return { id: found.id, ...found.data() } as DocumentData & { id: string };
    }
  } catch (err) {
    console.warn('Fallback getUserByEmail search failed:', err);
  }

  return null;
};

// ============================================
// TEAM INVITATION & MANAGEMENT (INSTAGRAM STYLE)
// ============================================

export interface UserTeam {
  id?: string;
  leader_id: string;
  leader_name: string;
  leader_email?: string;
  team_name: string;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

export type TeamInviteStatus = 'pending' | 'accepted' | 'rejected';

export interface TeamInvitation {
  id: string;
  team_id: string;
  team_name: string;
  leader_id: string;
  leader_name: string;
  leader_email?: string;
  recipient_id: string;
  recipient_name: string;
  recipient_email?: string;
  recipient_department?: string;
  status: TeamInviteStatus;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

export const getMyTeam = async (userId: string): Promise<UserTeam | null> => {
  const docSnap = await getDoc(doc(db, 'user_teams', userId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as UserTeam;
};

export const saveMyTeam = async (
  userId: string,
  teamName: string,
  leaderData: { name: string; email?: string }
): Promise<void> => {
  const teamRef = doc(db, 'user_teams', userId);
  const snap = await getDoc(teamRef);
  if (snap.exists()) {
    await updateDoc(teamRef, {
      team_name: teamName.trim(),
      updated_at: serverTimestamp(),
    });
  } else {
    await setDoc(teamRef, {
      leader_id: userId,
      leader_name: leaderData.name,
      leader_email: leaderData.email || '',
      team_name: teamName.trim(),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }
};

export const sendTeamInvite = async (
  leaderData: { id: string; name: string; email?: string },
  teamName: string,
  recipientUser: { id: string; name: string; email?: string; department?: string }
): Promise<string> => {
  if (leaderData.id === recipientUser.id) {
    throw new Error('You cannot invite yourself as a teammate.');
  }

  // Check if an invite already exists
  const invitesRef = collection(db, 'team_invitations');
  const q = query(
    invitesRef,
    where('leader_id', '==', leaderData.id),
    where('recipient_id', '==', recipientUser.id)
  );
  const existing = await getDocs(q);
  if (!existing.empty) {
    const existingDoc = existing.docs[0].data();
    if (existingDoc.status === 'pending') {
      throw new Error('An invitation is already pending for this student.');
    }
    if (existingDoc.status === 'accepted') {
      throw new Error('This student is already in your team.');
    }
    // If rejected, update to pending again
    await updateDoc(existing.docs[0].ref, {
      status: 'pending',
      team_name: teamName.trim(),
      updated_at: serverTimestamp(),
    });
    // Send notification
    await createNotification(
      recipientUser.id,
      'Team Invitation',
      `${leaderData.name} invited you to join their team "${teamName}".`,
      '/teams'
    );
    return existing.docs[0].id;
  }

  // Save leader's team
  await saveMyTeam(leaderData.id, teamName, leaderData);

  const docRef = await addDoc(invitesRef, stripUndefined({
    team_id: leaderData.id,
    team_name: teamName.trim(),
    leader_id: leaderData.id,
    leader_name: leaderData.name,
    leader_email: leaderData.email || '',
    recipient_id: recipientUser.id,
    recipient_name: recipientUser.name,
    recipient_email: recipientUser.email || '',
    recipient_department: recipientUser.department || '',
    status: 'pending' as TeamInviteStatus,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  }));

  // Send in-app notification and push notification to the teammate
  await createNotification(
    recipientUser.id,
    'Team Invitation',
    `${leaderData.name} invited you to join their team "${teamName}". Tap to accept or decline.`,
    '/teams'
  );
  // Call Python backend push notification
  import('./notificationApi').then(({ notifyTeamInviteAPI }) => {
    notifyTeamInviteAPI(recipientUser.id, teamName.trim(), leaderData.name).catch(() => {});
  });

  return docRef.id;
};

export const respondToTeamInvite = async (
  inviteId: string,
  status: 'accepted' | 'rejected'
): Promise<void> => {
  const inviteRef = doc(db, 'team_invitations', inviteId);
  const snap = await getDoc(inviteRef);
  if (!snap.exists()) throw new Error('Invitation not found');
  const data = snap.data();

  await updateDoc(inviteRef, {
    status,
    updated_at: serverTimestamp(),
  });

  // Notify the leader (in-app + push)
  if (data.leader_id) {
    const actionText = status === 'accepted' ? 'accepted your team invitation! 🎉' : 'declined your team invitation.';
    await createNotification(
      data.leader_id,
      status === 'accepted' ? 'Teammate Accepted' : 'Invitation Declined',
      `${data.recipient_name || 'A student'} has ${actionText}`,
      '/teams'
    );
    import('./notificationApi').then(({ notifyTeamInviteResponseAPI }) => {
      notifyTeamInviteResponseAPI(data.leader_id, data.recipient_name || 'A teammate', data.team_name || '', status === 'accepted').catch(() => {});
    });
  }
};

export const cancelTeamInvite = async (inviteId: string): Promise<void> => {
  await deleteDoc(doc(db, 'team_invitations', inviteId));
};

export const subscribeToTeamInvitesSent = (
  leaderId: string,
  callback: (invites: TeamInvitation[]) => void
) => {
  const invitesRef = collection(db, 'team_invitations');
  const q = query(invitesRef, where('leader_id', '==', leaderId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TeamInvitation)));
  });
};

export const subscribeToIncomingTeamInvites = (
  recipientId: string,
  callback: (invites: TeamInvitation[]) => void
) => {
  const invitesRef = collection(db, 'team_invitations');
  const q = query(invitesRef, where('recipient_id', '==', recipientId), where('status', '==', 'pending'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TeamInvitation)));
  });
};

export const subscribeToTeamsJoined = (
  recipientId: string,
  callback: (teams: TeamInvitation[]) => void
) => {
  const invitesRef = collection(db, 'team_invitations');
  const q = query(invitesRef, where('recipient_id', '==', recipientId), where('status', '==', 'accepted'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TeamInvitation)));
  });
};

// ============================================
// FCM PUSH NOTIFICATIONS
// ============================================

import { registerFCMTokenAPI, sendGenericPushNotificationAPI } from './notificationApi';

/**
 * Request notification permission and register FCM token for the current user.
 * Call this once after login.
 */
export const registerFCMToken = async (userId: string): Promise<void> => {
  if (!messaging) {
    console.warn('FCM messaging not available');
    return;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return;
    }
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });
    if (token) {
      await updateDoc(doc(db, 'users', userId), { fcmToken: token });
      await registerFCMTokenAPI(token);
      console.log('FCM token registered locally & backend:', token);
    }
  } catch (err) {
    console.error('FCM token registration failed:', err);
  }
};

/**
 * Listen to foreground FCM messages (when the app is open).
 */
export const listenToFCMMessages = (callback: (payload: any) => void) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    console.log('Foreground FCM message:', payload);
    callback(payload);
  });
};

/**
 * Send a push notification via FCM to a user via the Python Backend.
 */
const sendPushNotification = async (
  recipientId: string,
  title: string,
  body: string
): Promise<void> => {
  try {
    await sendGenericPushNotificationAPI([recipientId], title, body);
  } catch (err) {
    console.error('Failed to send push notification:', err);
  }
};

export { auth, db, messaging };
