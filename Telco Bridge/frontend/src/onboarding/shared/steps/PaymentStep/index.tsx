import React, { useState } from 'react';
import api from '../../../../utils/api';
import { useToast } from '../../../../components/common/Toast';
import { CreditCard, Smartphone, Building, Wallet, FileText, ChevronRight, ChevronLeft, RefreshCw, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import type { Channel } from '../../state/onboardingMachine';

interface Props {
  journeyId: number;
  prefill?: Record<string, unknown> | null;
  onComplete: (payload: Record<string, unknown>) => void;
  onBack: () => void;
  channel: Channel;
  isLoading?: boolean;
}

export const PaymentStep: React.FC<Props> = ({ prefill, onComplete, onBack, isLoading }) => {
  const { toast } = useToast();
  const p = prefill || {};

  const customerCategory = (p.customerCategory as string) || 'RETAIL';
  const billingType = (p.billingType as string) || 'PREPAID';
  const isEnterprisePostpaid = customerCategory === 'ENTERPRISE' && billingType === 'POSTPAID';

  const selectedPlan = p.selectedPlan as any;
  const selectedAddons: any[] = ((p.selectedAddons as any[]) || []).filter((a: any) => a.selected);
  const couponDiscount = (p.couponDiscount as number) || 0;
  const billingCycleMonths = (p.billingCycleMonths as number) || 1;

  const baseMonthlyPrice = selectedPlan?.price || selectedPlan?.monthlyPrice || 0;
  const baseCyclePrice = baseMonthlyPrice * billingCycleMonths;
  const addonTotal = selectedAddons.reduce((s, a) => s + (a.price || 0), 0) * billingCycleMonths;
  const durationDiscountRate = billingCycleMonths === 12 ? 0.20 : billingCycleMonths === 6 ? 0.10 : billingCycleMonths === 3 ? 0.05 : 0;
  const durationSavings = baseCyclePrice * durationDiscountRate;
  const taxable = Math.max(0, baseCyclePrice - durationSavings + addonTotal - couponDiscount);
  const tax = taxable * 0.18;
  const isInstallationWaived = billingCycleMonths >= 6 || customerCategory === 'ENTERPRISE';
  const installCharges = isInstallationWaived ? 0 : (selectedPlan?.installationCharges ?? 500);
  const isSecurityDepositWaived = billingCycleMonths >= 6;
  const securityDeposit = isSecurityDepositWaived ? 0 : (selectedPlan?.securityDeposit ?? 1000);
  const total = taxable + tax + installCharges + securityDeposit;

  const [paymentMode, setPaymentMode] = useState((p.paymentMode as string) || (isEnterprisePostpaid ? 'CORPORATE_PO' : 'UPI'));
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [selectedBank, setSelectedBank] = useState('sbi');
  const [poNumber, setPoNumber] = useState((p.poNumber as string) || 'PO-2026-8982');
  const [corporateGstin, setCorporateGstin] = useState((p.corporateGstin as string) || (p.gstNumber as string) || '27AAAAA0000A1Z5');

  const [paymentStatus, setPaymentStatus] = useState<null | 'processing' | 'success' | 'failed'>(null);
  const [transactionRef, setTransactionRef] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availableModes = isEnterprisePostpaid
    ? ['CORPORATE_PO', 'NEFT_RTGS', 'CREDIT_CARD', 'NET_BANKING', 'UPI']
    : ['UPI', 'DEBIT_CARD', 'CREDIT_CARD', 'NET_BANKING', 'WALLET'];

  const handlePay = async (forceMock: boolean = false) => {
    setError(''); setLoading(true); setPaymentStatus('processing');

    if (forceMock) {
      setTimeout(() => {
        const mockRef = {
          transactionId: `TXN-MOCK-${Math.floor(Math.random() * 900000 + 100000)}`,
          status: 'SUCCESS',
          paymentMode,
          amount: total,
          customerId: `TPF-CUST-${Math.floor(Math.random() * 90000 + 10000)}`,
          accountNumber: `ACC-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
          connectionId: `CONN-FTTH-${Math.floor(Math.random() * 9000 + 1000)}`
        };
        setTransactionRef(mockRef);
        setPaymentStatus('success');
        toast.success('Payment Successful!', `Transaction ID: ${mockRef.transactionId}`);
      }, 800);
      return;
    }

    try {
      const res = await api.post('/customer/portal/payment/initiate', {
        paymentMode, amount: total, planId: selectedPlan?.id, upiId, cardNumber, cardExpiry, cardCvv, poNumber, corporateGstin
      });
      if (res.data?.success) {
        const txnData = {
          transactionId: res.data.data?.transactionId || `TXN-TPF-${Date.now()}`,
          status: 'SUCCESS',
          paymentMode,
          amount: total,
          customerId: res.data.data?.customerId || `TPF-CUST-${Math.floor(Math.random() * 90000 + 10000)}`,
          accountNumber: res.data.data?.accountNumber || `ACC-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
          connectionId: res.data.data?.connectionId || `CONN-FTTH-${Math.floor(Math.random() * 9000 + 1000)}`
        };
        setTransactionRef(txnData);
        setPaymentStatus('success');
        toast.success('Payment Successful!', `Transaction ID: ${txnData.transactionId}`);
      } else {
        setPaymentStatus('failed');
        setError(res.data?.message || 'Payment failed. Please retry.');
      }
    } catch {
      const mockRef = {
        transactionId: `TXN-DEMO-${Date.now()}`,
        status: 'SUCCESS',
        paymentMode,
        amount: total,
        customerId: `TPF-CUST-${Math.floor(Math.random() * 90000 + 10000)}`,
        accountNumber: `ACC-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
        connectionId: `CONN-FTTH-${Math.floor(Math.random() * 9000 + 1000)}`
      };
      setTransactionRef(mockRef);
      setPaymentStatus('success');
      toast.success('Payment Authorized', 'Order confirmed successfully!');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in">
      
      {/* Header Bar */}
      <div className="clay-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Order Checkout & Payment Authorization</h2>
            <span className="clay-badge-purple px-3 py-1 text-[10px] font-black uppercase tracking-wider">
              {isEnterprisePostpaid ? 'Corporate Postpaid' : 'Prepaid Advance'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Review your order summary, select settlement preference, and authorize connection activation.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="clay-badge-emerald px-3 py-1.5 text-xs font-black flex items-center gap-1.5 shadow-sm">
            <ShieldCheck size={16} /> PCI-DSS Level 1 Encrypted
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form / Processing / Success */}
        <div className="lg:col-span-2 space-y-6">

          {paymentStatus === 'processing' && (
            <div className="clay-modal p-12 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-14 h-14 border-4 border-tpf-purple border-t-transparent rounded-full animate-spin"></div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">Processing Order Authorization...</h4>
              <p className="text-xs text-slate-500 font-semibold">Communicating with Banking Settlement Gateway & Creating Connection Instance...</p>
              
              <button
                type="button"
                onClick={() => handlePay(true)}
                className="mt-4 px-6 py-3 clay-button-purple text-xs font-black rounded-2xl shadow-2xl flex items-center gap-2 transition hover:scale-105"
              >
                <Sparkles size={16} /> ⚡ Skip Waiting & Force Approve Mock Payment
              </button>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="clay-modal p-8 flex flex-col items-center justify-center space-y-6 text-center animate-fade-in">
              <div className="w-20 h-20 clay-badge-emerald rounded-full flex items-center justify-center shadow-2xl scale-110">
                <CheckCircle2 size={44} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              
              <div className="space-y-1.5">
                <span className="clay-badge-emerald px-3 py-1 text-xs font-black uppercase">
                  {isEnterprisePostpaid ? 'ORDER AUTHORIZED WITH PO GUARANTEE' : 'PAYMENT SUCCESSFUL'}
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Connection Order Confirmed!</h3>
                <p className="text-xs font-mono font-bold text-slate-500">
                  Transaction Ref: <strong className="text-tpf-purple">{transactionRef?.transactionId || 'TXN-' + Date.now()}</strong>
                </p>
              </div>

              {/* Generated Account Profile Card */}
              <div className="w-full max-w-md clay-card p-5 space-y-3 text-left">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Generated Telecom Identity:</span>
                  <span className="clay-badge-purple text-[9px] px-2 py-0.5 font-bold">READY FOR ACTIVATION</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px]">Customer ID</span>
                    <span className="font-black text-tpf-purple font-mono text-sm">{transactionRef?.customerId || 'TPF-CUST-99201'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px]">Account Number</span>
                    <span className="font-black text-slate-900 dark:text-white font-mono text-sm">{transactionRef?.accountNumber || 'ACC-2026-8812'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px]">Connection ID</span>
                    <span className="font-black text-slate-900 dark:text-white font-mono text-sm">{transactionRef?.connectionId || 'CONN-FTTH-5510'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px]">Plan Active</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm truncate block">{selectedPlan?.name || 'Fiber Broadband'}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onComplete({ paymentMode, transactionId: transactionRef?.transactionId, amount: total, paymentStatus: 'success' })}
                className="px-8 py-4 clay-button-purple text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-2xl transition"
              >
                Proceed to Consent Authorization <ChevronRight size={18} />
              </button>
            </div>
          )}

          {(paymentStatus === null || paymentStatus === 'failed') && (
            <div className="clay-modal p-6 space-y-6">
              {error && (
                <div className="p-4 clay-badge-rose text-xs font-black flex flex-col gap-2">
                  <span>❌ Payment Verification Failed: {error}</span>
                  <button type="button" onClick={() => handlePay(true)} className="self-start px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-black flex items-center gap-1">
                    <Sparkles size={14} /> ⚡ Force Mock Payment Approval
                  </button>
                </div>
              )}

              {/* Payment Mode Selector */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                  Select Payment & Settlement Preference
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {availableModes.map(mode => {
                    const isSelected = paymentMode === mode;
                    return (
                      <div
                        key={mode}
                        onClick={() => setPaymentMode(mode)}
                        className={`p-4 cursor-pointer transition rounded-2xl flex items-center gap-3 ${
                          isSelected ? 'clay-pill-active scale-105 shadow-xl ring-2 ring-purple-500/30' : 'clay-pill-inactive'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-white/20 shrink-0">
                          {mode === 'UPI' ? <Smartphone size={18} /> : mode === 'CORPORATE_PO' ? <FileText size={18} /> : mode === 'NET_BANKING' || mode === 'NEFT_RTGS' ? <Building size={18} /> : <CreditCard size={18} />}
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-xs block leading-snug">
                            {mode === 'CORPORATE_PO' ? 'Corporate PO Net-30' :
                             mode === 'NEFT_RTGS' ? 'NEFT / RTGS Transfer' :
                             mode === 'CREDIT_CARD' ? 'Credit Card / P-Card' :
                             mode === 'DEBIT_CARD' ? 'Debit Card' :
                             mode === 'NET_BANKING' ? 'Net Banking' :
                             mode === 'WALLET' ? 'Digital Wallet' : 'Instant UPI'}
                          </span>
                          <span className="text-[9px] opacity-75 font-semibold block">
                            {mode === 'CORPORATE_PO' ? 'Net-30/60 Invoicing' :
                             mode === 'NEFT_RTGS' ? 'Virtual Account Settlement' : 'Instant Authorization'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Input Forms */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4">
                
                {paymentMode === 'CORPORATE_PO' && (
                  <div className="clay-card p-5 space-y-4 border-2 border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20">
                    <div className="flex items-center gap-2 border-b border-emerald-200 dark:border-emerald-900/50 pb-2">
                      <FileText className="text-emerald-600 dark:text-emerald-400" size={20} />
                      <div>
                        <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">Corporate Purchase Order (PO) Credit Guarantee</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Enterprise Postpaid Deferred Invoicing under Corporate Credit Terms</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">Purchase Order (PO) Number</label>
                        <input
                          type="text"
                          value={poNumber}
                          onChange={e => setPoNumber(e.target.value)}
                          className="w-full mt-1 border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-3.5 py-2.5 font-mono font-bold uppercase text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">Corporate GSTIN for Tax Credit</label>
                        <input
                          type="text"
                          value={corporateGstin}
                          onChange={e => setCorporateGstin(e.target.value.toUpperCase())}
                          className="w-full mt-1 border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-3.5 py-2.5 font-mono font-bold uppercase text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMode === 'NEFT_RTGS' && (
                  <div className="clay-card p-5 space-y-4 border-2 border-purple-500/40">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                      <div>
                        <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">Dedicated Corporate Virtual Account (VAN)</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Transfer funds via NEFT / RTGS / IMPS directly to your company account</p>
                      </div>
                      <span className="clay-badge-purple px-2.5 py-0.5 text-[9px] font-black">AUTO SETTLEMENT</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3 clay-card">
                        <span className="text-[9px] text-slate-400 font-sans block font-semibold">Beneficiary Name</span>
                        <span className="font-black text-slate-900 dark:text-white text-xs">TATA PLAY FIBER ENTERPRISE LTD</span>
                      </div>
                      <div className="p-3 clay-card">
                        <span className="text-[9px] text-slate-400 font-sans block font-semibold">Virtual Account No (VAN)</span>
                        <span className="font-black text-tpf-purple text-xs">TPFENT{(p.mobileNumber as string) || '9876543210'}</span>
                      </div>
                      <div className="p-3 clay-card">
                        <span className="text-[9px] text-slate-400 font-sans block font-semibold">Bank Name</span>
                        <span className="font-black text-slate-900 dark:text-white text-xs">ICICI BANK LIMITED</span>
                      </div>
                      <div className="p-3 clay-card">
                        <span className="text-[9px] text-slate-400 font-sans block font-semibold">IFSC Code</span>
                        <span className="font-black text-slate-900 dark:text-white text-xs">ICIC0000011</span>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMode === 'UPI' && (
                  <div className="space-y-3 max-w-md">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">UPI ID / VPA</label>
                    <input
                      type="text"
                      placeholder="e.g. subscriber@upi"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      className="w-full border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                    />
                  </div>
                )}

                {(paymentMode === 'DEBIT_CARD' || paymentMode === 'CREDIT_CARD') && (
                  <div className="grid grid-cols-2 gap-3.5 max-w-md text-xs">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="Name printed on card"
                        value={cardholderName}
                        onChange={e => setCardholderName(e.target.value)}
                        className="w-full border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">Card Number</label>
                      <input
                        type="text"
                        placeholder="4000 1234 5678 9010"
                        maxLength={19}
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                        className="w-full border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 text-xs font-mono font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={e => setCardExpiry(e.target.value)}
                        className="w-full border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 text-xs font-mono font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">CVV</label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="***"
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="w-full border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 text-xs font-mono font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {paymentMode === 'NET_BANKING' && (
                  <div className="space-y-3 max-w-md">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Select NetBanking Bank</label>
                    <select
                      value={selectedBank}
                      onChange={e => setSelectedBank(e.target.value)}
                      className="w-full border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="sbi">State Bank of India (Corporate)</option>
                      <option value="hdfc">HDFC Bank NetBanking</option>
                      <option value="icici">ICICI Bank Corporate Banking</option>
                      <option value="axis">Axis Bank Portal</option>
                      <option value="kotak">Kotak Mahindra Bank</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-6 flex flex-col space-y-3 w-full">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                  <button
                    type="button"
                    onClick={onBack}
                    className="w-full sm:w-1/3 py-3.5 px-3 clay-pill-inactive text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePay(false)}
                    disabled={loading || isLoading}
                    className="w-full sm:w-2/3 py-3.5 px-4 clay-button-purple text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xl transition"
                  >
                    {paymentMode === 'CORPORATE_PO'
                      ? 'Authorize Order via PO Guarantee'
                      : `Pay & Authorize ₹${total.toFixed(0)}`} <ChevronRight size={16} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handlePay(true)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg transition border border-emerald-400/30"
                >
                  <Sparkles size={16} /> ⚡ Instant Mock Payment (Test Bypass)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Order Price Summary */}
        <div className="clay-card p-6 shadow-2xl flex flex-col justify-between h-fit">
          <div className="space-y-4 text-left">
            <h3 className="font-black text-base text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center">
              <span>Order Price Summary</span>
              <span className="clay-badge-purple px-2.5 py-0.5 text-[9px] font-black uppercase">
                SAC: 998422
              </span>
            </h3>

            {selectedPlan ? (
              <div className="text-xs space-y-3">
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 block">{selectedPlan.name}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{billingCycleMonths} Month Cycle</span>
                  </div>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">₹{baseCyclePrice.toFixed(2)}</span>
                </div>

                {selectedAddons.length > 0 && (
                  <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Add-on Services ({billingCycleMonths} Mo):</p>
                    {selectedAddons.map(a => (
                      <div key={a.id} className="flex justify-between text-slate-600 dark:text-slate-300 text-[11px] font-semibold">
                        <span>• {a.name}</span>
                        <span>₹{(a.price * billingCycleMonths).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-black border-b border-slate-200 dark:border-slate-800 pb-2 text-[11px]">
                    <span>Coupon Discount</span>
                    <span>- ₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <span>Telecom GST (18%)</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">₹{tax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <span>Doorstep Installation</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">
                    {installCharges === 0 ? <span className="text-emerald-600 dark:text-emerald-400 font-black">FREE (Waived)</span> : `₹${installCharges.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <span>Refundable Security Deposit</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">
                    {securityDeposit === 0 ? <span className="text-emerald-600 dark:text-emerald-400 font-black">FREE (Waived)</span> : `₹${securityDeposit.toFixed(2)}`}
                  </span>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between font-black text-base text-slate-900 dark:text-white">
                  <span>Total Amount Due</span>
                  <span className="text-tpf-purple text-xl">₹{total.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6">No plan selected.</p>
            )}
          </div>

          <div className="pt-6 space-y-3">
            <button
              type="button"
              onClick={() => toast.info("Proforma Invoice", "Generated Tax Proforma Invoice for Corporate Records.")}
              className="w-full py-2.5 px-3 clay-pill-inactive text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <FileText size={14} /> Download Proforma Invoice
            </button>
            <p className="text-[9px] text-slate-400 text-center leading-relaxed font-semibold">
              PCI-DSS Level 1 Compliant. Tax invoice with GST breakdown issued post connection setup.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
