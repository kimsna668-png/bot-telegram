import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Clock, CheckCircle2, ShieldCheck, Copy, Check, Sparkles, Download, Key } from 'lucide-react';
import { api } from '../../services/api.js';

interface Props {
  paymentData: {
    paymentId: string;
    transactionRef: string;
    qrString: string;
    qrImageDataUrl?: string;
    currency: 'USD' | 'KHR';
    amount: number;
    expiresAt: string | Date;
    provider: string;
    orderNumber?: string;
  } | null;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export const KHQRModal: React.FC<Props> = ({ paymentData, onClose, onPaymentSuccess }) => {
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);
  const [status, setStatus] = useState<'PENDING' | 'SUCCESS' | 'EXPIRED'>('PENDING');
  const [isCopied, setIsCopied] = useState(false);
  const [deliveryData, setDeliveryData] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (!paymentData) return;

    // Calculate initial remaining seconds
    const expTime = new Date(paymentData.expiresAt).getTime();
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((expTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setStatus('EXPIRED');
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    // Authoritative Server-Side Polling every 3 seconds
    const pollInterval = setInterval(async () => {
      if (status === 'SUCCESS' || status === 'EXPIRED') return;
      try {
        const res = await api.post(`/payments/verify/${paymentData.transactionRef}`);
        if (res.data.success && res.data.verification?.isPaid) {
          setStatus('SUCCESS');
          // Fetch delivery details
          try {
            const delRes = await api.get(`/deliveries/order/${res.data.verification.orderId || ''}`);
            if (delRes.data.success) {
              setDeliveryData(delRes.data.delivery);
            }
          } catch {}
          if (onPaymentSuccess) onPaymentSuccess();
        }
      } catch (err) {
        // Continue polling
      }
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(pollInterval);
    };
  }, [paymentData, status]);

  if (!paymentData) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleCopyQR = () => {
    navigator.clipboard.writeText(paymentData.qrString);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    try {
      const res = await api.post(`/payments/sandbox-simulate-approval/${paymentData.transactionRef}`);
      if (res.data.success) {
        setStatus('SUCCESS');
        if (onPaymentSuccess) onPaymentSuccess();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-[#140826] border border-purple-800/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Bakong KHQR Header Banner */}
        <div className="bg-[#e1251b] px-4 py-3 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white text-[#e1251b] font-black flex items-center justify-center text-xs tracking-tighter">
              KH
            </div>
            <span className="font-extrabold tracking-wider text-sm">KHQR PAYMENT</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-black/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col items-center">
          {status === 'SUCCESS' ? (
            <div className="py-6 flex flex-col items-center text-center space-y-4 animate-scale-up">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-black text-white">Payment Confirmed!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Your Bakong payment was successfully verified by our server.
                </p>
              </div>

              {/* Instant Delivery Preview */}
              <div className="w-full p-4 rounded-xl bg-purple-950/80 border border-purple-800/40 text-left space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Instant Delivery Active</span>
                </div>
                <p className="text-xs text-slate-300">
                  Your digital goods have been sent directly to your Telegram chat and are available in your account orders hub.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-purple-600/30"
              >
                Done
              </button>
            </div>
          ) : status === 'EXPIRED' ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Payment Request Expired</h3>
              <p className="text-xs text-slate-400">
                This KHQR code has expired. Please initiate a new checkout.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-purple-800 text-white text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Amount Display */}
              <div className="text-center mb-3">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Payable</span>
                <div className="text-2xl font-black text-white tracking-tight mt-0.5">
                  {paymentData.currency === 'USD' ? `$${paymentData.amount.toFixed(2)}` : `${paymentData.amount.toLocaleString()} ៛`}
                </div>
                <div className="text-[11px] text-purple-400 font-mono mt-0.5">
                  Ref: {paymentData.transactionRef}
                </div>
              </div>

              {/* QR Code Container */}
              <div className="p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center relative">
                <QRCodeSVG
                  value={paymentData.qrString}
                  size={210}
                  level="M"
                  includeMargin={false}
                />
              </div>

              {/* Countdown & Instruction */}
              <div className="w-full mt-4 flex items-center justify-between text-xs text-slate-400 px-1">
                <div className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>Expires in: {formattedTime}</span>
                </div>
                <button
                  onClick={handleCopyQR}
                  className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-medium"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              {/* Instructions */}
              <div className="w-full mt-3 p-2.5 rounded-xl bg-purple-950/60 border border-purple-800/30 text-[11px] text-slate-400 text-center">
                Scan with <strong>Bakong</strong>, <strong>ABA</strong>, <strong>Wing</strong>, <strong>Acleda</strong> or any KHQR banking app.
              </div>

              {/* Sandbox Simulation Button (clearly labeled for dev/testing) */}
              {paymentData.provider === 'SANDBOX_KHQR' && (
                <div className="w-full mt-3 pt-3 border-t border-purple-900/40">
                  <button
                    onClick={handleSimulatePayment}
                    disabled={isSimulating}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isSimulating ? 'Simulating bank scan...' : '[Sandbox Test] Simulate Bank Scan'}</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
