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
  serverTimestamp,
  orderBy,
  type DocumentData,
  Timestamp
} from 'firebase/firestore';

export const ADMIN_EMAIL = 'palerugopi2008@gmail.com';

export const DEPARTMENTS = [
  'AIML', 'AIDS', 'CSE', 'CSE(AI)', 'CSE(DS)', 
  'IT', 'ECE', 'EEE', 'BME', 'BI', 'CYBER SECURITY'
];

const firebaseConfig = {
  apiKey: "AIzaSyAOOgIBLgcUOzRkbq2Y5i2IKI11eRH7rbk",
  authDomain: "seatsync-aaa2b.firebaseapp.com",
  projectId: "seatsync-aaa2b",
  storageBucket: "seatsync-aaa2b.firebasestorage.app",
  messagingSenderId: "629714324668",
  appId: "1:629714324668:web:45f83bd74a5e89804554b9",
  measurementId: "G-RH3LNR8YEF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

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

export const createUserDocument = async (
  uid: string, 
  data: { name: string; reg_no: string; department: string; role: 'student' | 'admin'; email?: string }
) => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { ...data, created_at: serverTimestamp() });
};

export const getUserDocument = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() };
  }
  return null;
};

export const updateUserRole = async (uid: string, role: 'student' | 'admin') => {
  const userRef = doc(db, 'users', uid);
  return updateDoc(userRef, { role });
};

export const createOrUpdateUserDocument = async (
  uid: string,
  email: string,
  data: { name: string; reg_no?: string; department?: string }
) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  const role = email === ADMIN_EMAIL ? 'admin' : 'student';
  if (userSnap.exists()) {
    if (email === ADMIN_EMAIL && userSnap.data().role !== 'admin') {
      await updateDoc(userRef, { role: 'admin' });
    }
    return { id: userSnap.id, ...userSnap.data(), role };
  } else {
    const userData = {
      name: data.name,
      reg_no: data.reg_no || '',
      department: data.department || '',
      email: email,
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
// Sets a `is_blocked: true/false` flag on the user document.
// Blocked students can still log in but cannot register for workshops.

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

export interface EventData {
  id?: string;
  title: string;
  type: 'Workshop' | 'Seminar';
  date: string;
  start_time?: string;
  end_time?: string;
  total_seats: number;
  available_seats: number;
  status: 'Upcoming' | 'Closed';
  is_mandatory: boolean;
  target_branches: string[];
  created_at?: Timestamp;
}

export const createEvent = async (data: {
  title: string;
  type: 'Workshop' | 'Seminar';
  date: string;
  start_time: string;
  end_time: string;
  total_seats: number;
  is_mandatory: boolean;
  target_branches: string[];
}) => {
  const eventsRef = collection(db, 'events');
  return addDoc(eventsRef, {
    ...data,
    available_seats: data.total_seats,
    status: 'Upcoming',
    created_at: serverTimestamp()
  });
};

export const updateEventStatus = async (eventId: string, status: 'Upcoming' | 'Closed') => {
  const eventRef = doc(db, 'events', eventId);
  return updateDoc(eventRef, { status });
};

export const updateEvent = async (eventId: string, data: Partial<EventData>) => {
  const eventRef = doc(db, 'events', eventId);
  return updateDoc(eventRef, data);
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

  const eventIds = registrations.docs.map(doc => doc.data().event_id);
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

export const registerForEvent = async (userId: string, eventId: string, userDepartment: string) => {
  const eventRef         = doc(db, 'events', eventId);
  const userRef          = doc(db, 'users', userId);
  const registrationsRef = collection(db, 'registrations');
  const waitlistRef      = collection(db, 'waitlist');

  // ── Block check ──────────────────────────────────────────
  const userSnap = await getDoc(userRef);
  if (userSnap.exists() && userSnap.data().is_blocked === true) {
    throw new Error(
      'Your account has been blocked by the admin. You cannot register for workshops at this time. Please contact your administrator for assistance.'
    );
  }

  // Duplicate registration check
  const regQuery = query(registrationsRef, where('user_id', '==', userId), where('event_id', '==', eventId));
  const existingReg = await getDocs(regQuery);
  if (!existingReg.empty) throw new Error('Already registered for this workshop');

  // Duplicate waitlist check
  const waitlistQuery = query(waitlistRef, where('user_id', '==', userId), where('event_id', '==', eventId));
  const existingWaitlist = await getDocs(waitlistQuery);
  if (!existingWaitlist.empty) throw new Error('Already on the waitlist for this workshop');

  const eventDoc = await getDoc(eventRef);
  if (!eventDoc.exists()) throw new Error('Workshop does not exist');
  const eventData = eventDoc.data();

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

  return runTransaction(db, async (transaction) => {
    const freshEvent = await transaction.get(eventRef);
    if (!freshEvent.exists()) throw new Error('Workshop does not exist');
    const freshData = freshEvent.data();

    if (freshData.available_seats > 0) {
      transaction.update(eventRef, { available_seats: freshData.available_seats - 1 });
      const newRegRef = doc(registrationsRef);
      transaction.set(newRegRef, {
        user_id: userId,
        event_id: eventId,
        timestamp: serverTimestamp(),
        status: 'confirmed'
      });
      return { status: 'registered', message: 'Successfully registered!' };
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
      return { status: 'waitlisted', message: 'Added to waitlist!' };
    }
  });
};

export const cancelRegistration = async (userId: string, eventId: string) => {
  const eventRef         = doc(db, 'events', eventId);
  const registrationsRef = collection(db, 'registrations');
  const waitlistRef      = collection(db, 'waitlist');

  const regQuery    = query(registrationsRef, where('user_id', '==', userId), where('event_id', '==', eventId));
  const regSnapshot = await getDocs(regQuery);

  if (regSnapshot.empty) {
    const waitlistQuery    = query(waitlistRef, where('user_id', '==', userId), where('event_id', '==', eventId));
    const waitlistSnapshot = await getDocs(waitlistQuery);
    if (!waitlistSnapshot.empty) {
      await deleteDoc(waitlistSnapshot.docs[0].ref);
      return { status: 'removed_from_waitlist' };
    }
    throw new Error('Registration not found');
  }

  const registrationDoc = regSnapshot.docs[0];

  const waitlistQuery    = query(waitlistRef, where('event_id', '==', eventId));
  const waitlistSnapshot = await getDocs(waitlistQuery);
  const sortedWaitlist   = waitlistSnapshot.docs.sort((a, b) => (a.data().position || 0) - (b.data().position || 0));
  const nextInLine       = sortedWaitlist.length > 0 ? sortedWaitlist[0] : null;

  return runTransaction(db, async (transaction) => {
    const eventDoc = await transaction.get(eventRef);
    if (!eventDoc.exists()) throw new Error('Workshop does not exist');
    const eventData = eventDoc.data();

    transaction.delete(registrationDoc.ref);

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
      return { status: 'cancelled_and_promoted', promotedUserId: nextUserId };
    } else {
      transaction.update(eventRef, { available_seats: eventData.available_seats + 1 });
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
  totalSeats: number;
  enrolledCount: number;
  waitlistCount: number;
  utilizationPercent: number;
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
    const eventId = doc.data().event_id;
    registrationsByEvent[eventId] = (registrationsByEvent[eventId] || 0) + 1;
  });
  waitlistSnap.docs.forEach(doc => {
    const eventId = doc.data().event_id;
    waitlistByEvent[eventId] = (waitlistByEvent[eventId] || 0) + 1;
  });

  return eventsSnap.docs.map(doc => {
    const event            = doc.data();
    const enrolledCount    = registrationsByEvent[doc.id] || 0;
    const waitlistCount    = waitlistByEvent[doc.id] || 0;
    const utilizationPercent = event.total_seats > 0
      ? Math.round((enrolledCount / event.total_seats) * 100) : 0;

    let demandLevel: 'High' | 'Medium' | 'Low' = 'Low';
    if (utilizationPercent >= 80 || waitlistCount > 0) demandLevel = 'High';
    else if (utilizationPercent >= 50) demandLevel = 'Medium';

    return {
      eventId: doc.id,
      title: event.title,
      type: event.type,
      date: event.date,
      totalSeats: event.total_seats,
      enrolledCount,
      waitlistCount,
      utilizationPercent,
      demandLevel,
      isMandatory: event.is_mandatory || false
    };
  });
};

// ============================================
// COMPLIANCE TRACKING
// ============================================

export interface ComplianceStatus {
  userId: string;
  userName: string;
  regNo: string;
  department: string;
  totalMandatory: number;
  completedMandatory: number;
  pendingMandatory: number;
  compliancePercent: number;
  isCompliant: boolean;
  pendingWorkshops: string[];
}

export const getComplianceStatus = async (): Promise<ComplianceStatus[]> => {
  const usersRef         = collection(db, 'users');
  const eventsRef        = collection(db, 'events');
  const registrationsRef = collection(db, 'registrations');

  const [usersSnap, eventsSnap, regsSnap] = await Promise.all([
    getDocs(query(usersRef, where('role', '==', 'student'))),
    getDocs(query(eventsRef, where('is_mandatory', '==', true))),
    getDocs(registrationsRef)
  ]);

  const mandatoryEvents = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const registrationsByUser: Record<string, Set<string>> = {};
  regsSnap.docs.forEach(doc => {
    const userId  = doc.data().user_id;
    const eventId = doc.data().event_id;
    if (!registrationsByUser[userId]) registrationsByUser[userId] = new Set();
    registrationsByUser[userId].add(eventId);
  });

  return usersSnap.docs.map(userDoc => {
    const user    = userDoc.data();
    const userRegs = registrationsByUser[userDoc.id] || new Set();

    const relevantMandatory = mandatoryEvents.filter(event => {
      const branches = (event as { target_branches?: string[] }).target_branches || [];
      return branches.length === 0 || branches.includes(user.department);
    });

    const completedMandatory = relevantMandatory.filter(e => userRegs.has(e.id)).length;
    const pendingWorkshops   = relevantMandatory
      .filter(e => !userRegs.has(e.id))
      .map(e => (e as unknown as { title: string }).title);

    const totalMandatory     = relevantMandatory.length;
    const compliancePercent  = totalMandatory > 0
      ? Math.round((completedMandatory / totalMandatory) * 100) : 100;

    return {
      userId: userDoc.id,
      userName: user.name,
      regNo: user.reg_no,
      department: user.department,
      totalMandatory,
      completedMandatory,
      pendingMandatory: totalMandatory - completedMandatory,
      compliancePercent,
      isCompliant: completedMandatory >= totalMandatory,
      pendingWorkshops
    };
  });
};

export const getStudentCompliance = async (userId: string, department: string): Promise<{
  mandatory: { event: DocumentData; completed: boolean }[];
  compliancePercent: number;
  isCompliant: boolean;
}> => {
  const eventsRef        = collection(db, 'events');
  const registrationsRef = collection(db, 'registrations');

  const [eventsSnap, regsSnap] = await Promise.all([
    getDocs(query(eventsRef, where('is_mandatory', '==', true))),
    getDocs(query(registrationsRef, where('user_id', '==', userId)))
  ]);

  const userEventIds = new Set(regsSnap.docs.map(doc => doc.data().event_id));

  const mandatoryEvents = eventsSnap.docs
    .filter(doc => {
      const event    = doc.data();
      const branches = event.target_branches || [];
      return branches.length === 0 || branches.includes(department);
    })
    .map(doc => ({
      event: { id: doc.id, ...doc.data() },
      completed: userEventIds.has(doc.id)
    }));

  const completedCount = mandatoryEvents.filter(m => m.completed).length;
  const totalCount     = mandatoryEvents.length;

  return {
    mandatory: mandatoryEvents,
    compliancePercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100,
    isCompliant: completedCount >= totalCount
  };
};

export { auth, db };
