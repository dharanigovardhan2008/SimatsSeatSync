import React from 'react';
import { AlertTriangle, Phone, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface TransactionErrorProps {
  title: string;
  message: string;
  transactionId?: string;
  onRetry?: () => void;
}

/**
 * Error state component showing failure details and support options
 */
export const TransactionError: React.FC<TransactionErrorProps> = ({
  title,
  message,
  transactionId,
  onRetry,
}) => {
  const handleContactSupport = () => {
    // Open email or support channel
    const subject = transactionId
      ? `Payment Issue - Transaction ${transactionId}`
      : 'Payment Issue';
    window.location.href = `mailto:support@seatsync.com?subject=${encodeURIComponent(subject)}`;
  };

  return (
    <Card className="border-2" hover={false}>
      <div className="space-y-6 text-center">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-[#FF3B30]/10 border-2 border-[#FF3B30]/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-[#FF3B30]" />
          </div>
        </div>

        {/* Error Title */}
        <div>
          <h2 className="text-2xl font-bold text-[#1D1D1F]">{title}</h2>
          <p className="text-[#5E6C84] text-base mt-2 leading-relaxed max-w-md mx-auto">
            {message}
          </p>
        </div>

        {/* Transaction ID if provided */}
        {transactionId && (
          <div className="p-4 rounded-xl bg-[#F9F9FB] border border-black/5">
            <p className="text-xs font-bold text-[#5E6C84] uppercase tracking-wide mb-1">
              Reference ID
            </p>
            <p className="font-mono text-sm text-[#1D1D1F]">{transactionId}</p>
          </div>
        )}

        {/* Support Options */}
        <div className="space-y-3 pt-4 border-t border-black/5">
          <p className="text-sm font-semibold text-[#1D1D1F]">
            Need help? Contact support
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={handleContactSupport}
            >
              <MessageSquare className="w-4 h-4" />
              Email Support
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={() => window.location.href = 'tel:+919876543210'}
            >
              <Phone className="w-4 h-4" />
              Call Support
            </Button>
          </div>
        </div>

        {/* Retry Button */}
        {onRetry && (
          <div className="pt-4">
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              onClick={onRetry}
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TransactionError;
