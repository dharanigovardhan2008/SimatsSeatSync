export type EventType = 'workshop' | 'seminar' | 'hackathon';
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export type RegistrationStatus = 'open' | 'closed' | 'full';

export interface EventSpeaker {
  id: string;
  name: string;
  title: string;
  bio: string;
  image?: string;
  linkedin?: string;
  twitter?: string;
}

export interface EventSchedule {
  id: string;
  time: string;
  title: string;
  description: string;
  speaker?: string;
  duration: number; // minutes
}

export interface HackathonPrize {
  position: string; // '1st', '2nd', '3rd'
  amount: string;
  description?: string;
}

export interface HackathonTrack {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface Event {
  id: string;
  title: string;
  type: EventType;
  status: EventStatus;
  
  // Basic Info
  description: string;
  longDescription?: string;
  image?: string;
  venue: string;
  
  // Date & Time
  date: Date;
  startTime: string;
  endTime: string;
  duration?: string; // "2 hours" or "48 hours"
  
  // Seats & Registration
  totalSeats: number;
  availableSeats: number;
  registeredCount: number;
  registrationStatus: RegistrationStatus;
  registrationDeadline?: Date;
  
  // Details
  speakers?: EventSpeaker[];
  schedule?: EventSchedule[];
  prerequisites?: string[];
  whatYouWillLearn?: string[];
  
  // Hackathon Specific
  prizes?: HackathonPrize[];
  tracks?: HackathonTrack[];
  teamSize?: {
    min: number;
    max: number;
  };
  themes?: string[];
  
  // Additional
  tags?: string[];
  level?: 'beginner' | 'intermediate' | 'advanced';
  certificateProvided?: boolean;
  recordingAvailable?: boolean;
  
  // Admin
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  teamName?: string; // For hackathons
  teamMembers?: string[]; // For hackathons
  registeredAt: Date;
  attended: boolean;
  certificateIssued: boolean;
}
