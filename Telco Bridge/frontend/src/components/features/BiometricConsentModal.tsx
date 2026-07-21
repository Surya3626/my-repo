import React, { useState } from 'react';
import { Fingerprint, Scan, ShieldCheck, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useToast } from '../common/Toast';

interface BiometricConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerMobile?: string;
}

export const BiometricConsentModal: React.FC<BiometricConsentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customerMobile,
}) => {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS' | 'FAILED'>('IDLE');

  if (!isOpen) return null;

  const handleSimulateBiometric = () => {
    setScanning(true);
    setStatus('SCANNING');

    setTimeout(() => {
      setScanning(false);
      setStatus('SUCCESS');
      toast.success('Biometric Verified', 'Fingerprint / Face ID biometric consent successfully authenticated.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="glass-panel border-2 border-purple-500/40 rounded-3xl p-6 bg-slate-900 text-white w-full max-w-sm shadow-2xl space-y-5 text-center">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={16} /> Aadhaar Biometric eKYC
          </span>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Biometric Animation Area */}
        <div className="py-4 space-y-4">
          <div className="relative w-24 h-24 mx-auto rounded-full bg-purple-500/10 border-2 border-purple-500/30 flex items-center justify-center">
            {status === 'SUCCESS' ? (
              <CheckCircle2 size={48} className="text-emerald-400 animate-bounce" />
            ) : status === 'SCANNING' ? (
              <Scan size={48} className="text-purple-400 animate-spin" />
            ) : (
              <Fingerprint size={48} className="text-purple-400 hover:scale-110 transition cursor-pointer" onClick={handleSimulateBiometric} />
            )}

            {scanning && (
              <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
            )}
          </div>

          <div className="space-y-1">
            <h4 className="font-extrabold text-base text-white">
              {status === 'SUCCESS'
                ? 'Biometric Authentication Approved!'
                : status === 'SCANNING'
                ? 'Scanning Fingerprint / Face ID...'
                : 'Touch Sensor for Biometric Consent'}
            </h4>
            <p className="text-xs text-slate-400">
              UIDAI Aadhaar Verified Biometric Simulation for customer: {customerMobile || 'RMN'}
            </p>
          </div>
        </div>

        {/* Actions */}
        {status !== 'SUCCESS' && (
          <button
            type="button"
            onClick={handleSimulateBiometric}
            disabled={scanning}
            className="w-full py-3 bg-gradient-to-r from-tpf-purple to-tpf-pink text-white text-xs font-extrabold rounded-2xl shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Fingerprint size={18} /> Simulate Biometric Scan Now
          </button>
        )}
      </div>
    </div>
  );
};
