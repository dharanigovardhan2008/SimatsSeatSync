import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { PaymentProof } from '@/lib/firebase';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  upiId?: string;
  qrImage?: string;
  payeeName: string;
  eventTitle: string;
  submitting: boolean;
  error?: string;
  onSubmit: (proof: PaymentProof) => void;
}

/**
 * Collects a UPI payment.
 *
 * Important: this can only OPEN a UPI app with the amount and payee
 * pre-filled — it cannot know whether the payment actually succeeded.
 * There is no callback from a UPI app back to a website. So after the
 * student pays, they type in the transaction reference number (UTR) the
 * app shows them, and that's what a coordinator later checks by hand
 * against their own UPI app or bank statement (see the Payment
 * Verification queue). The ticket only unlocks once that check happens.
 */
export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen, onClose, amount, upiId, qrImage, payeeName, eventTitle, submitting, error, onSubmit,
}) => {
  const [utr, setUtr] = useState('');
  const [step, setStep] = useState<'pay' | 'confirm'>('pay');

  const note = encodeURIComponent(`${eventTitle} registration`);
  const upiParams = upiId
    ? `pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${note}`
    : '';

  // The generic upi:// scheme is the one Android actually uses to show a
  // chooser of every UPI app installed on the phone ("PhonePe, GPay,
  // Paytm, or other" in one link). App-specific schemes (gpay/phonepe/
  // paytm) are undocumented and inconsistent, so they're offered only as
  // a secondary shortcut, not the primary path.
  const genericUpiLink = upiId ? `upi://pay?${upiParams}` : '';
  const appLinks = upiId
    ? [
        { label: 'GPay', href: `tez://upi/pay?${upiParams}` },
        { label: 'PhonePe', href: `phonepe://pay?${upiParams}` },
        { label: 'Paytm', href: `paytmmp://pay?${upiParams}` },
      ]
    : [];

  const openLink = (href: string) => {
    window.location.href = href;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr.trim()) return;
    onSubmit({ utr: utr.trim(), amount });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="medium">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-[#1D1D1F] mb-1">Pay to Register</h2>
        <p className="text-sm text-[#5E6C84] mb-6">
          ₹{amount} for {eventTitle}
        </p>

        {step === 'pay' ? (
          <div className="space-y-5">
            {upiId && (
              <>
                <button
                  type="button"
                  onClick={() => openLink(genericUpiLink)}
                  className="w-full py-4 rounded-2xl bg-[#1D1D1F] text-white font-bold text-[15px] hover:bg-black transition-colors active:scale-95"
                >
                  Pay via UPI — ₹{amount}
                </button>
                <p className="text-xs text-center text-[#A0AEC0] -mt-3">
                  Opens your phone's UPI app chooser (Android). On iPhone, use the QR code below instead.
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {appLinks.map((app) => (
                    <button
                      key={app.label}
                      type="button"
                      onClick={() => openLink(app.href)}
                      className="py-2.5 rounded-xl bg-[#F9F9FB] border border-black/5 text-[13px] font-bold text-[#1D1D1F] hover:bg-black/5 transition-colors"
                    >
                      {app.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {qrImage && (
              <div className="text-center">
                {upiId && <p className="text-xs font-bold text-[#5E6C84] uppercase tracking-wide mb-3">Or scan to pay</p>}
                <img src={qrImage} alt="Payment QR code" className="w-48 h-48 mx-auto rounded-2xl border border-black/10 object-contain" />
              </div>
            )}

            {upiId && (
              <div className="p-3 rounded-xl bg-[#F9F9FB] border border-black/5 text-center">
                <p className="text-xs text-[#5E6C84]">UPI ID</p>
                <p className="font-bold text-[#1D1D1F]">{upiId}</p>
              </div>
            )}

            <Button variant="primary" className="w-full" onClick={() => setStep('confirm')}>
              I've Paid — Enter Reference Number
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

            <Input
              label="UPI Transaction Reference (UTR)"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="12-digit number from your payment app"
              required
            />
            <p className="text-xs text-[#A0AEC0]">
              Find this in your UPI app's transaction history — it's usually called "UPI Ref No." or
              "Transaction ID". Your ticket won't be available until the coordinator manually confirms
              this reference against their own bank/UPI app; there's no way for the website to verify
              a UPI payment on its own.
            </p>

            <div className="flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep('pay')}>
                Back
              </Button>
              <Button type="submit" variant="primary" className="flex-1" isLoading={submitting}>
                Submit for Verification
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default PaymentModal;
