import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react';

interface InvoiceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  payment: any;
  subscription: any;
}

export const InvoiceDrawer: React.FC<InvoiceDrawerProps> = ({
  isOpen,
  onClose,
  customer,
  payment,
  subscription
}) => {
  if (!isOpen) return null;

  const invoiceNo = payment?.transactionId ? `INV-${payment.transactionId.replace('TXN', '')}` : `INV-${Date.now().toString().slice(-8)}`;
  const invoiceDate = payment?.createdAt ? new Date(payment.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
  const amount = payment?.amount || subscription?.plan?.price || 999;
  const taxAmount = (amount * 0.18).toFixed(2);
  const baseAmount = (amount - Number(taxAmount)).toFixed(2);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 relative print:p-0 print:border-none print:shadow-none">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition print:hidden"
        >
          <X size={20} />
        </button>

        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b dark:border-slate-800 pb-6 gap-4">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black gradient-text">TelcoBridge</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800/30 flex items-center gap-1">
                <CheckCircle2 size={12} /> PAID
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">TelcoBridge Technologies Private Limited | GSTIN: 27AABCT1234F1ZH</p>

            <p className="text-[11px] text-slate-400">SAC Code: 998422 (Internet Telecommunication Services)</p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">TAX INVOICE</h4>
            <p className="text-xs font-bold text-tpf-purple">{invoiceNo}</p>
            <p className="text-xs text-slate-400">Date: {invoiceDate}</p>
          </div>
        </div>

        {/* Customer & Billing Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-left bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border dark:border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Billed To</span>
            <p className="font-extrabold text-slate-800 dark:text-white">{customer?.firstName} {customer?.lastName}</p>
            <p className="text-slate-500 dark:text-slate-400">Cust ID: {customer?.customerId || 'TPF98721'}</p>
            <p className="text-slate-500 dark:text-slate-400">Account: {customer?.accountNumber || 'ACC392019'}</p>
            <p className="text-slate-500 dark:text-slate-400">Mobile: {customer?.mobileNumber}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Payment Summary</span>
            <p className="text-slate-600 dark:text-slate-300"><span className="font-semibold">Txn ID:</span> {payment?.transactionId || 'TXN8291039'}</p>
            <p className="text-slate-600 dark:text-slate-300"><span className="font-semibold">Mode:</span> {payment?.paymentMode || 'UPI'}</p>
            <p className="text-slate-600 dark:text-slate-300"><span className="font-semibold">Status:</span> <span className="text-emerald-600 font-bold">SUCCESS</span></p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto text-left">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-2">Description</th>
                <th className="py-2 text-center">HSN/SAC</th>
                <th className="py-2 text-right">Base Price</th>
                <th className="py-2 text-right">GST (18%)</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              <tr>
                <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                  {subscription?.plan?.name || 'Superfast Fiber 100 Mbps Plan'} (1 Month Unlimited)
                </td>
                <td className="py-3 text-center text-slate-500">998422</td>
                <td className="py-3 text-right text-slate-700 dark:text-slate-300">₹{baseAmount}</td>
                <td className="py-3 text-right text-slate-700 dark:text-slate-300">₹{taxAmount}</td>
                <td className="py-3 text-right font-bold text-slate-900 dark:text-white">₹{amount}</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-slate-500">Dual-Band WiFi 6 Router Rental</td>
                <td className="py-3 text-center text-slate-500">998422</td>
                <td className="py-3 text-right text-slate-500">₹0.00</td>
                <td className="py-3 text-right text-slate-500">₹0.00</td>
                <td className="py-3 text-right text-emerald-600 font-bold">WAIVED</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Invoice Total Box */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-left gap-4">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xs">
            <ShieldCheck size={18} className="text-tpf-purple" />
            <span>Electronically generated tax invoice. No signature required.</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Amount Paid</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">₹{amount}</span>
          </div>
        </div>

        {/* Print / Export Action buttons */}
        <div className="flex justify-end gap-3 pt-2 print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border text-xs font-bold text-slate-600 dark:text-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white gradient-bg hover:opacity-90 flex items-center gap-2 shadow-md"
          >
            <Printer size={16} /> Print / Save PDF
          </button>
        </div>

      </div>
    </div>
  );
};
