import React from 'react';
import { Download, Share2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { TransactionStatus } from '@/pages/TransactionStatus';

interface TransactionData {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  amount: number;
  paymentMethod: 'upi';
  transactionId: string;
  participantName: string;
  timestamp: Date | null;
  status: TransactionStatus;
}

interface TransactionReceiptProps {
  transaction: TransactionData;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date | null): string => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(date);
};

/**
 * Transaction receipt showing detailed payment information.
 * Includes options to download and share the receipt.
 */
export const TransactionReceipt: React.FC<TransactionReceiptProps> = ({ transaction }) => {
  const handleDownloadReceipt = async () => {
    try {
      // Create receipt content
      const receiptContent = `
TRANSACTION RECEIPT
════════════════════════════════════════

Event: ${transaction.eventTitle}
Participant: ${transaction.participantName}

Amount Paid: ${formatCurrency(transaction.amount)}
Payment Method: UPI
Transaction ID: ${transaction.transactionId}
Date & Time: ${formatDate(transaction.timestamp)}

Status: ${transaction.status === 'success' ? 'VERIFIED' : 'PENDING VERIFICATION'}
Registration ID: ${transaction.registrationId}

════════════════════════════════════════
Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

Please keep this receipt for your records.
      `.trim();

      // Create blob and download
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(receiptContent));
      element.setAttribute('download', `receipt-${transaction.transactionId}.txt`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Failed to download receipt:', error);
    }
  };

  const handleShareReceipt = async () => {
    const shareText = `I've registered for ${transaction.eventTitle} on SeatSync! 🎉

Amount: ${formatCurrency(transaction.amount)}
Status: ${transaction.status === 'success' ? 'Verified' : 'Pending Verification'}
Transaction ID: ${transaction.transactionId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SeatSync Transaction Receipt',
          text: shareText,
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Receipt copied to clipboard!');
      } catch {
        console.error('Failed to copy');
      }
    }
  };

  return (
    <div className="mb-8">
      <Card className="border-2" hover={false}>
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#1D1D1F]">Receipt Details</h3>

          {/* Receipt Rows */}
          <div className="space-y-3">
            <ReceiptRow
              label="Amount Paid"
              value={formatCurrency(transaction.amount)}
              highlight
            />
            <ReceiptRow
              label="Payment Method"
              value="UPI (Bank Transfer)"
            />
            <ReceiptRow
              label="Transaction ID"
              value={transaction.transactionId}
              mono
            />
            <ReceiptRow
              label="Date & Time"
              value={formatDate(transaction.timestamp)}
            />
            <ReceiptRow
              label="Event"
              value={transaction.eventTitle}
            />
            <ReceiptRow
              label="Participant"
              value={transaction.participantName}
            />
            {transaction.status === 'success' && (
              <ReceiptRow
                label="Verification Status"
                value="✓ Verified by Coordinator"
                success
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-black/5">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={handleDownloadReceipt}
            >
              <Download className="w-4 h-4" />
              Download Receipt
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={handleShareReceipt}
            >
              <Share2 className="w-4 h-4" />
              Share Receipt
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

/**
 * Individual receipt row showing label and value
 */
const ReceiptRow: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
  success?: boolean;
}> = ({ label, value, highlight, mono, success }) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-[#F9F9FB] border border-black/5">
      <span className="text-sm text-[#5E6C84] font-medium">{label}</span>
      <span
        className={`text-sm font-semibold text-right ${
          highlight ? 'text-[#1D1D1F] text-base font-extrabold' : 'text-[#1D1D1F]'
        } ${mono ? 'font-mono' : ''} ${success ? 'text-[#34C759]' : ''}`}
      >
        {value}
      </span>
    </div>
  );
};

export default TransactionReceipt;
