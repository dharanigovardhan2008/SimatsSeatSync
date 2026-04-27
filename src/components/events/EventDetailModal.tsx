import React, { useState } from 'react';
import { Event, EventRegistration } from '@/types/event.types';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatTime } from '@/utils/eventUtils';
import { useAuth } from '@/context/AuthContext';
import { registerForEvent } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface EventDetailModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ 
  event, 
  isOpen, 
  onClose 
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'speakers'>('overview');
  const [isRegistering, setIsRegistering] = useState(false);
  const [teamData, setTeamData] = useState({
    teamName: '',
    members: ['']
  });

  const handleRegister = async () => {
    if (!currentUser) {
      toast.error('Please login to register');
      return;
    }

    setIsRegistering(true);
    try {
      const registration: Partial<EventRegistration> = {
        eventId: event.id,
        userId: currentUser.uid,
        userName: currentUser.displayName || '',
        userEmail: currentUser.email || '',
        registeredAt: new Date(),
        attended: false,
        certificateIssued: false
      };

      // Add team info for hackathons
      if (event.type === 'hackathon') {
        registration.teamName = teamData.teamName;
        registration.teamMembers = teamData.members.filter(m => m.trim());
      }

      await registerForEvent(registration);
      toast.success('Successfully registered!');
      onClose();
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="max-h-[90vh] overflow-y-auto">
        {/* Header Image */}
        {event.image && (
          <div className="relative h-64 w-full">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex gap-2 mb-3">
                <Badge className="bg-white/90 text-gray-800">
                  {event.type.toUpperCase()}
                </Badge>
                <Badge className={getStatusBadgeColor(event.status)}>
                  {event.status.toUpperCase()}
                </Badge>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {event.title}
              </h2>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <InfoCard icon="📅" label="Date" value={formatDate(event.date)} />
            <InfoCard icon="⏰" label="Time" value={`${event.startTime} - ${event.endTime}`} />
            <InfoCard icon="📍" label="Venue" value={event.venue} />
            <InfoCard 
              icon="🪑" 
              label="Seats" 
              value={`${event.availableSeats} / ${event.totalSeats}`}
              highlight={event.availableSeats < event.totalSeats * 0.2}
            />
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex gap-4">
              <TabButton
                active={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </TabButton>
              {event.schedule && event.schedule.length > 0 && (
                <TabButton
                  active={activeTab === 'schedule'}
                  onClick={() => setActiveTab('schedule')}
                >
                  Schedule
                </TabButton>
              )}
              {event.speakers && event.speakers.length > 0 && (
                <TabButton
                  active={activeTab === 'speakers'}
                  onClick={() => setActiveTab('speakers')}
                >
                  Speakers
                </TabButton>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="mb-6">
            {activeTab === 'overview' && (
              <OverviewTab event={event} />
            )}
            {activeTab === 'schedule' && event.schedule && (
              <ScheduleTab schedule={event.schedule} />
            )}
            {activeTab === 'speakers' && event.speakers && (
              <SpeakersTab speakers={event.speakers} />
            )}
          </div>

          {/* Hackathon Team Form */}
          {event.type === 'hackathon' && event.availableSeats > 0 && (
            <HackathonTeamForm
              teamData={teamData}
              setTeamData={setTeamData}
              teamSize={event.teamSize}
            />
          )}

          {/* Registration Button */}
          <div className="flex gap-4">
            {event.availableSeats > 0 ? (
              <button
                onClick={handleRegister}
                disabled={isRegistering}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 
                         text-white py-4 rounded-lg font-bold text-lg
                         hover:from-blue-700 hover:to-purple-700 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {isRegistering ? 'Registering...' : 'Register Now'}
              </button>
            ) : (
              <button
                disabled
                className="flex-1 bg-gray-300 text-gray-600 py-4 rounded-lg font-bold text-lg cursor-not-allowed"
              >
                Event Full
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-8 py-4 border-2 border-gray-300 rounded-lg font-semibold
                       hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Sub-components

const InfoCard: React.FC<{
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}> = ({ icon, label, value, highlight }) => (
  <div className={`p-4 rounded-lg ${highlight ? 'bg-orange-50 border-2 border-orange-200' : 'bg-gray-50'}`}>
    <div className="text-2xl mb-2">{icon}</div>
    <div className="text-xs text-gray-600 mb-1">{label}</div>
    <div className={`font-semibold ${highlight ? 'text-orange-600' : 'text-gray-900'}`}>
      {value}
    </div>
  </div>
);

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`pb-3 px-1 font-medium transition-colors relative
      ${active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
  >
    {children}
    {active && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
    )}
  </button>
);

const OverviewTab: React.FC<{ event: Event }> = ({ event }) => (
  <div className="space-y-6">
    {/* Description */}
    <div>
      <h3 className="text-xl font-bold mb-3">About This Event</h3>
      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
        {event.longDescription || event.description}
      </p>
    </div>

    {/* What You'll Learn */}
    {event.whatYouWillLearn && event.whatYouWillLearn.length > 0 && (
      <div>
        <h3 className="text-xl font-bold mb-3">What You'll Learn</h3>
        <ul className="space-y-2">
          {event.whatYouWillLearn.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="text-green-500 mt-1">✓</span>
              <span className="text-gray-700">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Prerequisites */}
    {event.prerequisites && event.prerequisites.length > 0 && (
      <div>
        <h3 className="text-xl font-bold mb-3">Prerequisites</h3>
        <ul className="space-y-2">
          {event.prerequisites.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="text-blue-500">•</span>
              <span className="text-gray-700">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Hackathon Prizes */}
    {event.type === 'hackathon' && event.prizes && (
      <div>
        <h3 className="text-xl font-bold mb-3">🏆 Prizes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {event.prizes.map((prize, idx) => (
            <div key={idx} className="bg-gradient-to-br from-yellow-50 to-orange-50 
                                    border-2 border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
              </div>
              <div className="font-bold text-lg mb-1">{prize.position} Prize</div>
              <div className="text-2xl font-bold text-orange-600 mb-2">
                {prize.amount}
              </div>
              {prize.description && (
                <div className="text-sm text-gray-600">{prize.description}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Hackathon Tracks */}
    {event.type === 'hackathon' && event.tracks && (
      <div>
        <h3 className="text-xl font-bold mb-3">Tracks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {event.tracks.map((track) => (
            <div 
              key={track.id}
              className="p-4 border-2 rounded-lg"
              style={{ borderColor: track.color }}
            >
              <h4 className="font-bold mb-2" style={{ color: track.color }}>
                {track.name}
              </h4>
              <p className="text-sm text-gray-600">{track.description}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Additional Info */}
    <div className="flex flex-wrap gap-4 pt-4 border-t">
      {event.level && (
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Level:</span>
          <Badge>{event.level}</Badge>
        </div>
      )}
      {event.certificateProvided && (
        <div className="flex items-center gap-2 text-green-600">
          <span>✓</span>
          <span>Certificate Provided</span>
        </div>
      )}
      {event.recordingAvailable && (
        <div className="flex items-center gap-2 text-blue-600">
          <span>🎥</span>
          <span>Recording Available</span>
        </div>
      )}
    </div>
  </div>
);

const ScheduleTab: React.FC<{ schedule: Event['schedule'] }> = ({ schedule }) => (
  <div className="space-y-4">
    {schedule?.map((item, idx) => (
      <div key={item.id} className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center 
                         font-bold text-blue-600">
            {idx + 1}
          </div>
          {idx < schedule.length - 1 && (
            <div className="w-0.5 h-full bg-blue-200 my-2" />
          )}
        </div>
        <div className="flex-1 pb-8">
          <div className="text-sm text-gray-500 mb-1">{item.time}</div>
          <h4 className="font-bold text-lg mb-1">{item.title}</h4>
          <p className="text-gray-600 mb-2">{item.description}</p>
          {item.speaker && (
            <div className="text-sm text-blue-600">👤 {item.speaker}</div>
          )}
          <div className="text-xs text-gray-500 mt-1">
            Duration: {item.duration} minutes
          </div>
        </div>
      </div>
    ))}
  </div>
);

const SpeakersTab: React.FC<{ speakers: Event['speakers'] }> = ({ speakers }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {speakers?.map((speaker) => (
      <div key={speaker.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-shrink-0">
          {speaker.image ? (
            <img
              src={speaker.image}
              alt={speaker.name}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 
                          flex items-center justify-center text-white text-2xl font-bold">
              {speaker.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-lg mb-1">{speaker.name}</h4>
          <p className="text-sm text-gray-600 mb-2">{speaker.title}</p>
          <p className="text-sm text-gray-700 mb-3">{speaker.bio}</p>
          <div className="flex gap-3">
            {speaker.linkedin && (
              <a
                href={speaker.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                LinkedIn
              </a>
            )}
            {speaker.twitter && (
              <a
                href={speaker.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-500"
              >
                Twitter
              </a>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const HackathonTeamForm: React.FC<{
  teamData: any;
  setTeamData: any;
  teamSize?: { min: number; max: number };
}> = ({ teamData, setTeamData, teamSize }) => {
  const addMember = () => {
    if (!teamSize || teamData.members.length < teamSize.max) {
      setTeamData({
        ...teamData,
        members: [...teamData.members, '']
      });
    }
  };

  const removeMember = (index: number) => {
    setTeamData({
      ...teamData,
      members: teamData.members.filter((_: any, i: number) => i !== index)
    });
  };

  const updateMember = (index: number, value: string) => {
    const newMembers = [...teamData.members];
    newMembers[index] = value;
    setTeamData({ ...teamData, members: newMembers });
  };

  return (
    <div className="mb-6 p-6 bg-purple-50 border-2 border-purple-200 rounded-lg">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>👥</span>
        <span>Team Registration</span>
      </h3>
      
      {teamSize && (
        <p className="text-sm text-gray-600 mb-4">
          Team size: {teamSize.min} - {teamSize.max} members
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Team Name *</label>
          <input
            type="text"
            value={teamData.teamName}
            onChange={(e) => setTeamData({ ...teamData, teamName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="Enter your team name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Team Members</label>
          {teamData.members.map((member: string, index: number) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="email"
                value={member}
                onChange={(e) => updateMember(index, e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder={`Member ${index + 1} email`}
              />
              {index > 0 && (
                <button
                  onClick={() => removeMember(index)}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          
          {(!teamSize || teamData.members.length < teamSize.max) && (
            <button
              onClick={addMember}
              className="mt-2 px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200"
            >
              + Add Member
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function
function getStatusBadgeColor(status: Event['status']) {
  switch (status) {
    case 'upcoming': return 'bg-blue-100 text-blue-800';
    case 'ongoing': return 'bg-green-100 text-green-800';
    case 'completed': return 'bg-gray-100 text-gray-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
