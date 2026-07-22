import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Building2, CheckCircle2, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import api from '../../utils/api';
import { useToast } from '../common/Toast';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: any;
  onSuccess: () => void;
}

export const RechargeModal: React.FC<RechargeModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  onSuccess
}) => {
  const { toast } = useToast();
  const [tenure, setTenure] = useState<number>(1); // 1, 3, 6, 12 months
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING'>('UPI');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState<any>(null);

  if (!isOpen) return null;

  const monthlyPrice = currentPlan?.price || 999;
  
  // Calculate discounts
  const discountMultiplier = tenure === 12 ? 0.80 : tenure === 6 ? 0.85 : tenure === 3 ? 0.90 : 1.0;
  const rawTotal = monthlyPrice * tenure;
  const discountedTotal = Math.round(rawTotal * discountMultiplier);
  const savings = rawTotal - discountedTotal;
  const gstTax = Math.round(discountedTotal * 0.18);
  const finalPayable = discountedTotal + gstTax;

  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/customer/portal/recharge', {
        amount: finalPayable,
        paymentMode,
        months: tenure,
        planId: currentPlan?.id
      });

      if (res.data?.success) {
        setSuccessResult(res.data.data);
        toast.success("Recharge Successful!", `Account renewed for ${tenure} month(s). Txn ID: ${res.data.data?.transactionId || ''}`);
        onSuccess();
      } else {
        const msg = res.data?.message || 'Recharge failed. Please try again.';
        setError(msg);
        toast.error("Recharge Failed", msg);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Transaction failed. Please check payment details.';
      setError(msg);
      toast.error("Payment Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="clay-modal max-w-xl w-full p-8 space-y-6 relative text-left">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
        >
          <X size={20} />
        </button>

        {!successResult ? (
          <>
            {/* Header */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 clay-badge-purple flex items-center justify-center font-bold text-tpf-purple">
                  <Zap size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Quick Account Recharge</h3>
              </div>
              <p className="text-xs text-slate-400">Instantly renew or extend your TelcoBridge high-speed connection.</p>
            </div>

            <form onSubmit={handleRechargeSubmit} className="space-y-6">
              
              {/* Plan & Speed Header */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 border border-purple-500/20 flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-tpf-purple tracking-wider block">Selected Plan</span>
                  <span className="text-base font-extrabold text-slate-800 dark:text-white">{currentPlan?.name || 'Superfast Fiber 100 Mbps'}</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{currentPlan?.speedMbps || 100} Mbps Unlimited Data</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Base Price</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white">₹{monthlyPrice}<span className="text-xs font-medium text-slate-400">/mo</span></span>
                </div>
              </div>

              {/* Tenure Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Select Recharge Validity</label>
                <div className="grid grid-cols-4 gap-2 text-xs font-extrabold">
                  {[
                    { m: 1, label: '1 Month', badge: null },
                    { m: 3, label: '3 Months', badge: '10% OFF' },
                    { m: 6, label: '6 Months', badge: '15% OFF' },
                    { m: 12, label: '1 Year', badge: '20% OFF' },
                  ].map((item) => (
                    <button
                      key={item.m}
                      type="button"
                      onClick={() => setTenure(item.m)}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-between gap-1 relative ${
                        tenure === item.m
                          ? 'gradient-bg text-white border-transparent shadow-md'
                          : 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {item.badge && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase ${
                          tenure === item.m ? 'bg-white text-tpf-purple' : 'bg-tpf-pink text-white'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-3 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('UPI')}
                    className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 transition ${
                      paymentMode === 'UPI'
                        ? 'border-tpf-purple bg-purple-50 dark:bg-purple-950/30 text-tpf-purple font-extrabold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Smartphone size={16} /> Instant UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('CREDIT_CARD')}
                    className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 transition ${
                      paymentMode === 'CREDIT_CARD' || paymentMode === 'DEBIT_CARD'
                        ? 'border-tpf-purple bg-purple-50 dark:bg-purple-950/30 text-tpf-purple font-extrabold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <CreditCard size={16} /> Credit/Debit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('NET_BANKING')}
                    className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 transition ${
                      paymentMode === 'NET_BANKING'
                        ? 'border-tpf-purple bg-purple-50 dark:bg-purple-950/30 text-tpf-purple font-extrabold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Building2 size={16} /> Net Banking
                  </button>
                </div>
              </div>

              {/* UPI ID Input if UPI selected */}
              {paymentMode === 'UPI' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Virtual Payment Address (UPI ID)</label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. mobileNumber@upi or name@okaxis"
                    className="w-full border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                  />
                </div>
              )}

              {/* Cost Summary Box */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-2 border dark:border-slate-800 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Plan Rental ({tenure} Month{tenure > 1 ? 's' : ''})</span>
                  <span>₹{rawTotal}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Tenure Discount</span>
                    <span>- ₹{savings}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>GST Telecom Tax (18%)</span>
                  <span>+ ₹{gstTax}</span>
                </div>
                <div className="flex justify-between border-t dark:border-slate-700/60 pt-2 text-sm font-extrabold text-slate-900 dark:text-white">
                  <span>Total Payable Amount</span>
                  <span className="text-base gradient-text font-black">₹{finalPayable}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 font-extrabold text-xs text-white gradient-bg rounded-2xl hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <span>Processing Payment securely...</span>
                ) : (
                  <>
                    <ShieldCheck size={18} /> Pay ₹{finalPayable} & Activate Subscription
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Payment Success Confirmation */
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-300 dark:border-emerald-700 shadow-xl">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Recharge Successful!</h3>
              <p className="text-xs text-slate-400">Your TelcoBridge account has been extended by {tenure} Month{tenure > 1 ? 's' : ''}.</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border dark:border-slate-800 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{successResult.payment?.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">₹{successResult.payment?.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Method</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{successResult.payment?.paymentMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">New Expiry Date</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {new Date(successResult.subscription?.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl text-white font-extrabold text-xs gradient-bg hover:opacity-90 shadow-md"
            >
              Done & Return to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
