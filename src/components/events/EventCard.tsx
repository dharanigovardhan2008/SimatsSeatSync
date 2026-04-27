import React from 'react';
import { Event } from '@/types/event.types';
import { formatDate, formatTime } from '@/utils/eventUtils';
import { Badge } from '@/components/ui/Badge';

interface EventCardProps {
  event: Event;
  onClick: (event: Event) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  const getEventIcon = () => {
    switch (event.type) {
      case 'workshop': return '🛠️';
      case 'seminar': return '🎓';
      case 'hackathon': return '💻';
      default: return '📅';
    }
  };

  const getStatusColor = () => {
    switch (event.status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeatStatus = () => {
    const percentage = (event.availableSeats / event.totalSeats) * 100;
    if (percentage === 0) return { text: 'Full', color: 'text-red-600' };
    if (percentage < 20) return { text: 'Filling Fast', color: 'text-orange-600' };
    return { text: 'Available', color: 'text-green-600' };
  };

  const seatStatus = getSeatStatus();

  return (
    <div
      onClick={() => onClick(event)}
      className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 
                 cursor-pointer overflow-hidden group transform hover:-translate-y-1"
    >
      {/* Image Header */}
      {event.image ? (
        <div className="relative h-48 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3">
            <Badge className={getStatusColor()}>
              {event.status.toUpperCase()}
            </Badge>
          </div>
          <div className="absolute top-3 left-3">
            <Badge className="bg-white/90 text-gray-800">
              {getEventIcon()} {event.type.toUpperCase()}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-6xl">{getEventIcon()}</span>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {event.title}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {event.description}
        </p>

        {/* Event Info Grid */}
        <div className="space-y-3 mb-4">
          {/* Date & Time */}
          <div className="flex items-center text-sm text-gray-700">
            <span className="mr-2">📅</span>
            <span>{formatDate(event.date)}</span>
          </div>

          <div className="flex items-center text-sm text-gray-700">
            <span className="mr-2">⏰</span>
            <span>{event.startTime} - {event.endTime}</span>
          </div>

          {/* Venue */}
          <div className="flex items-center text-sm text-gray-700">
            <span className="mr-2">📍</span>
            <span className="line-clamp-1">{event.venue}</span>
          </div>

          {/* Seats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-700">
              <span className="mr-2">🪑</span>
              <span>
                <span className={`font-semibold ${seatStatus.color}`}>
                  {event.availableSeats}
                </span>
                <span className="text-gray-500"> / {event.totalSeats} seats</span>
              </span>
            </div>
            <span className={`text-xs font-medium ${seatStatus.color}`}>
              {seatStatus.text}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
              style={{
                width: `${((event.totalSeats - event.availableSeats) / event.totalSeats) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {event.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {event.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{event.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Hackathon Specific Info */}
        {event.type === 'hackathon' && event.prizes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-xs text-gray-600">Prize Pool</p>
                <p className="font-bold text-yellow-700">
                  {event.prizes[0]?.amount}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 
                         text-white py-3 rounded-lg font-semibold
                         hover:from-blue-700 hover:to-purple-700 
                         transition-all duration-300 
                         flex items-center justify-center gap-2
                         group-hover:shadow-lg">
          View Details
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>
    </div>
  );
};
