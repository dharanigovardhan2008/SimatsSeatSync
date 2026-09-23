import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { PaymentVerificationModal } from '@/components/events/PaymentVerificationModal';
import { getEventById } from '@/lib/firebase';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import type { DocumentData } from 'firebase/firestore';

/**
 * Reached when a coordinator/admin taps a "New payment submitted"
 * notification — goes straight to that event's verification queue
 * instead of making them hunt for the right card on their dashboard.
 */
export const PaymentVerificationPage: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { userData, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<DocumentData | null>(null);

  useEffect(() => {
    if (!authLoading && (!userData || (userData.role !== 'coordinator' && userData.role !== 'admin'))) {
      navigate('/');
    }
  }, [userData, authLoading, navigate]);

  useEffect(() => {
    if (!eventId) return;
    getEventById(eventId).then(setEvent);
  }, [eventId]);

  const goBack = () => navigate(userData?.role === 'admin' ? '/admin/events' : '/coordinator');

  if (authLoading || !event) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <PaymentVerificationModal
        isOpen={true}
        onClose={goBack}
        eventId={eventId!}
        eventTitle={event.title}
      />
    </div>
  );
};

export default PaymentVerificationPage;
