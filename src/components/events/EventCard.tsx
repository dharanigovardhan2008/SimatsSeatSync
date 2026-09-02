import React from 'react';
import { Link } from 'react-router-dom';
import type { DocumentData } from 'firebase/firestore';

interface EventCardProps {
  event: DocumentData;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const image = event.images?.[0];

  return (
    <Link
      to={`/event/${event.id}`}
      className="block bg-white rounded-3xl shadow-md hover:shadow-lg transition-shadow p-4 flex items-center gap-4"
    >
      {image ? (
        <img src={image} alt={event.title} className="w-16 h-16 rounded-2xl object-cover shrink-0" />
      ) : (
        <div className="w-16 h-16 rounded-2xl bg-gray-100 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
        <p className="text-sm text-gray-500 truncate mt-1">
          {event.location?.address || event.date}
        </p>
      </div>
      <span className="bg-black text-white text-xs font-semibold rounded-full px-4 py-2 shrink-0">
        Get a Ticket
      </span>
    </Link>
  );
};

export default EventCard;