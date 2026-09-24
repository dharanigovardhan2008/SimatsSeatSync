import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Smartphone, QrCode } from 'lucide-react';

interface PaymentMethodSelectorProps {
  amount: number;
  eventTitle: string;
  selectedMethod: string | null;
  onMethodSelect: (method: string) => void;
  isProcessing: boolean;
  error?: string;
  onErrorDismiss: () => void;
}

/**
 * PaymentMethodSelector — Razorpay-style method cards
 *
 * Shows two primary payment options:
 * 1. Pay via UPI (opens Razorpay modal)
 * 2. Scan QR Code (opens Razorpay QR option)
 */
export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  amount,
  eventTitle,
  selectedMethod,
  onMethodSelect,
  isProcessing,
  error,
  onErrorDismiss,
}) => {
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);

  const methods = [
    {
      id: 'upi',
      name: 'Pay via UPI',
      description: 'Transfer funds directly from your bank using UPI',
      icon: Smartphone,
      apps: ['GPay', 'PhonePe', 'Paytm', 'BHIM'],
    },
    {
      id: 'qr',
      name: 'Scan QR Code',
      description: 'Use your banking app to scan and pay',
      icon: QrCode,
      apps: [],
    },
  ];

  return (
    <div className="space-y-4">
      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-sm font-bold text-red-600">!</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-900">{error}</p>
          </div>
          <button
            onClick={onErrorDismiss}
            className="text-red-600 hover:text-red-700 flex-shrink-0 ml-2"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Payment Methods */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#1D1D1F] uppercase tracking-wide">
          Select Payment Method
        </h3>

        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          const isExpanded = expandedMethod === method.id;

          return (
            <div key={method.id}>
              {/* Method Card */}
              <button
                onClick={() => {
                  onMethodSelect(method.id);
                  setExpandedMethod(isExpanded ? null : method.id);
                }}
                disabled={isProcessing}
                className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                  isSelected
                    ? 'bg-[#3B9EFF]/10 border-[#3B9EFF] shadow-md'
                    : 'bg-[#F9F9FB] border-black/5 hover:border-[#3B9EFF]/30'
                } disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]`}
                aria-label={`Select ${method.name}`}
                aria-pressed={isSelected}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className={`w-6 h-6 mt-0.5 flex-shrink-0 ${
                      isSelected ? 'text-[#3B9EFF]' : 'text-[#5E6C84]'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${
                        isSelected ? 'text-[#3B9EFF]' : 'text-[#1D1D1F]'
                      }`}>
                        {method.name}
                      </p>
                      <p className="text-xs text-[#5E6C84] mt-0.5">
                        {method.description}
                      </p>
                    </div>
                  </div>

                  {/* Chevron */}
                  <div className={`w-5 h-5 flex-shrink-0 mt-0.5 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}>
                    <svg
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      className={isSelected ? 'text-[#3B9EFF]' : 'text-[#5E6C84]'}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && isSelected && (
                <Card className="mt-2 border-[#3B9EFF]/20 bg-[#3B9EFF]/5">
                  <div className="space-y-4">
                    {method.id === 'upi' && (
                      <>
                        <div>
                          <p className="text-xs font-bold text-[#5E6C84] uppercase tracking-wide mb-3">
                            Available UPI Apps
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {method.apps.map((app) => (
                              <div
                                key={app}
                                className="p-3 rounded-xl bg-white border border-black/5 hover:bg-[#F9F9FB] transition-colors cursor-pointer text-center"
                              >
                                <p className="text-sm font-semibold text-[#1D1D1F]">
                                  {app}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-black/5 pt-3">
                          <p className="text-xs font-bold text-[#5E6C84] uppercase tracking-wide mb-2">
                            Or Enter UPI ID
                          </p>
                          <input
                            type="text"
                            placeholder="yourname@bank"
                            className="w-full px-3 py-2.5 rounded-xl bg-white border border-black/10 text-sm font-medium placeholder-[#A0AEC0] focus:outline-none focus:ring-2 focus:ring-[#3B9EFF] focus:border-transparent"
                            aria-label="UPI ID"
                          />
                        </div>
                      </>
                    )}

                    {method.id === 'qr' && (
                      <div className="text-center py-6">
                        <div className="w-40 h-40 mx-auto mb-4 bg-white rounded-xl border-2 border-dashed border-[#3B9EFF]/30 flex items-center justify-center">
                          <div className="text-center">
                            <QrCode className="w-12 h-12 text-[#3B9EFF]/50 mx-auto mb-2" />
                            <p className="text-xs text-[#5E6C84]">
                              QR Code will appear here
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-[#5E6C84]">
                          Scan this with your banking app to complete payment
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="p-3 rounded-xl bg-[#3B9EFF]/5 border border-[#3B9EFF]/10">
        <p className="text-xs text-[#1D1D1F]">
          <span className="font-semibold">Secure Payment:</span> Your payment is processed securely through Razorpay. We never store your banking credentials.
        </p>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
