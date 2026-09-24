import React from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import type { DocumentData } from 'firebase/firestore';

interface OrderSummaryProps {
  event: DocumentData;
  student: DocumentData | null;
  amount: number;
}

/**
 * Order Summary — Left-side card showing payment breakdown
 * Desktop: sticky sidebar
 * Mobile: top section above payment methods
 */
export const OrderSummary: React.FC<OrderSummaryProps> = ({
  event,
  student,
  amount,
}) => {
  const convenienceFee = 0; // Can be calculated based on amount or event config
  const total = amount + convenienceFee;

  if (!student) {
    return (
      <Card className="sticky top-4">
        <Skeleton type="card" />
      </Card>
    );
  }

  return (
    <Card className="sticky top-4">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-bold text-[#1D1D1F]">Order Summary</h2>
        </div>

        {/* Event Info */}
        {event.images?.[0] && (
          <div className="rounded-2xl overflow-hidden aspect-video bg-gray-200">
            <img
              src={event.images[0]}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div>
          <p className="text-sm text-[#5E6C84] font-medium mb-1">EVENT</p>
          <p className="text-base font-semibold text-[#1D1D1F]">{event.title}</p>
          {event.date && (
            <p className="text-xs text-[#5E6C84] mt-1">
              {new Date(event.date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-black/5" />

        {/* Price Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#5E6C84]">Base Amount</span>
            <span className="text-sm font-semibold text-[#1D1D1F]">
              ₹{amount.toLocaleString('en-IN')}
            </span>
          </div>

          {convenienceFee > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#5E6C84]">Convenience Fee</span>
              <span className="text-sm font-semibold text-[#1D1D1F]">
                ₹{convenienceFee.toLocaleString('en-IN')}
              </span>
            </div>
          )}

          <div className="border-t border-black/5 pt-3 flex justify-between items-center">
            <span className="font-semibold text-[#1D1D1F]">Total Amount</span>
            <span className="text-xl font-extrabold text-[#3B9EFF]">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-black/5" />

        {/* Student Info */}
        <div className="space-y-3">
          <div>
            <p className="text-xs text-[#5E6C84] font-bold uppercase tracking-wide mb-1">
              Student
            </p>
            <p className="text-sm font-semibold text-[#1D1D1F]">{student.name}</p>
            {student.reg_no && (
              <p className="text-xs text-[#5E6C84] mt-1">Reg: {student.reg_no}</p>
            )}
          </div>

          <div>
            <p className="text-xs text-[#5E6C84] font-bold uppercase tracking-wide mb-1">
              Email
            </p>
            <p className="text-xs font-mono text-[#1D1D1F] break-all">
              {student.email || 'Not provided'}
            </p>
          </div>

          {student.department && (
            <div>
              <p className="text-xs text-[#5E6C84] font-bold uppercase tracking-wide mb-1">
                Department
              </p>
              <p className="text-sm font-semibold text-[#1D1D1F]">
                {student.department}
              </p>
            </div>
          )}
        </div>

        {/* Trust Badge */}
        <div className="p-3 rounded-xl bg-[#F9F9FB] border border-black/5 flex items-center gap-2">
          <div className="w-4 h-4 text-[#34C759]">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.5 1.5H5.75A4.25 4.25 0 0 0 1.5 5.75v8.5A4.25 4.25 0 0 0 5.75 18.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-4.75" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-[#5E6C84]">
            Secure payment powered by Razorpay
          </p>
        </div>
      </div>
    </Card>
  );
};

export default OrderSummary;
