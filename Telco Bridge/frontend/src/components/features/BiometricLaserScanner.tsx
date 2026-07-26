import React, { useState, useEffect } from 'react';
import { ShieldCheck, Camera, Sparkles, CheckCircle2, Scan, Activity } from 'lucide-react';

interface BiometricLaserScannerProps {
  onScanComplete?: () => void;
  label?: string;
  isVerifying?: boolean;
}

export const BiometricLaserScanner: React.FC<BiometricLaserScannerProps> = ({
  onScanComplete,
  label = "AI Liveness Biometric & Facial Mesh Scan",
  isVerifying = false,
}) => {
  const [scanProgress, setScanProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [scanStep, setScanStep] = useState('Position face inside target reticle...');

  const handleStartScan = () => {
    setScanProgress(0);
    setIsDone(false);
    setScanStep('Initializing 3D depth sensors & landmark nodes...');

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDone(true);
          setScanStep('Biometric Match Confirmed • Cryptographic Seal Active');
          if (onScanComplete) onScanComplete();
          return 100;
        }
        if (prev === 20) setScanStep('Mapping 68 facial node landmarks & iris geometry...');
        if (prev === 60) setScanStep('Verifying anti-spoofing micro-movement liveness...');
        if (prev === 85) setScanStep('Hashing SHA-256 biometric token against Aadhaar Vault...');
        return prev + 5;
      });
    }, 100);
  };

  return (
    <div className="clay-card p-6 space-y-5 border-2 border-purple-500/30 text-left relative overflow-hidden bg-slate-950 text-white shadow-2xl">
      {/* Top Laser Grid Overlay */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black border border-purple-500/30">
            <Scan size={20} className="animate-pulse text-purple-400" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white tracking-wider uppercase">{label}</h4>
            <span className="text-[10px] text-slate-400 font-medium">DoT Mandated E-KYC Facial & Document Liveness Check</span>
          </div>
        </div>

        <span className="clay-badge-purple px-3 py-1 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
          <Activity size={12} className="text-emerald-400 animate-ping" /> AI BIOMETRIC 3D
        </span>
      </div>

      {/* Main HUD Frame with Scanning Laser */}
      <div className="relative h-56 rounded-3xl bg-slate-900/90 border-2 border-purple-500/40 overflow-hidden flex items-center justify-center shadow-inner">
        {/* Subtle HUD Matrix Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:20px_20px] opacity-25" />

        {/* Floating Reticle Bracket Corners */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-purple-400 rounded-tl-xl" />
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-purple-400 rounded-tr-xl" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-purple-400 rounded-bl-xl" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-purple-400 rounded-br-xl" />

        {/* 3D Facial Target Mesh Overlay */}
        <div className="relative z-10 flex flex-col items-center">
          {!isDone ? (
            <div className="relative">
              {/* Pulsing Outer Node Ring */}
              <div className="w-28 h-28 rounded-full border-2 border-purple-500/50 animate-ping absolute inset-0 pointer-events-none" />
              
              {/* Facial Geometry Target Circle */}
              <div className="w-28 h-28 rounded-full border-2 border-dashed border-tpf-purple flex items-center justify-center relative bg-purple-950/30 backdrop-blur-sm shadow-2xl">
                <Camera size={36} className="text-purple-300 animate-pulse" />
                
                {/* Animated Node Dots */}
                <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-4 left-6 shadow-[0_0_8px_#34d399] animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-4 right-6 shadow-[0_0_8px_#34d399] animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 absolute bottom-6 left-1/2 -translate-x-1/2 shadow-[0_0_8px_#34d399] animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 animate-victory-burst">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-2xl ring-4 ring-emerald-400/40">
                <CheckCircle2 size={44} />
              </div>
              <span className="text-xs font-black text-emerald-400 uppercase tracking-widest pt-1">Liveness Verified 100%</span>
            </div>
          )}
        </div>

        {/* Continuous Neon Laser Sweep Line */}
        {scanProgress > 0 && scanProgress < 100 && (
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_15px_#c084fc] animate-laser-sweep z-20 pointer-events-none" />
        )}

        {/* Live Audio / Frequency Sound-wave Indicator Bars */}
        <div className="absolute bottom-3 inset-x-6 flex justify-between items-end h-6 opacity-60 z-10">
          {[12, 24, 18, 30, 16, 28, 22, 14, 32, 20, 26, 15].map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-t bg-purple-400 transition-all duration-300"
              style={{
                height: scanProgress > 0 && !isDone ? `${Math.sin(scanProgress + i) * 12 + 14}px` : '4px',
              }}
            />
          ))}
        </div>
      </div>

      {/* Progress & Live Telemetry Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-extrabold text-slate-300 flex items-center gap-1.5">
            <Sparkles size={14} className="text-purple-400" />
            {scanStep}
          </span>
          <span className="font-mono font-black text-purple-400">{scanProgress}%</span>
        </div>

        {/* Dynamic Glowing Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-emerald-400 shadow-[0_0_10px_#a855f7] transition-all duration-200"
            style={{ width: `${scanProgress}%` }}
          />
        </div>
      </div>

      {/* Scan CTA Trigger */}
      {!isDone && (
        <button
          type="button"
          onClick={handleStartScan}
          disabled={scanProgress > 0 && scanProgress < 100}
          className="w-full py-3.5 clay-button-purple text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl"
        >
          <Camera size={16} /> Run AI Biometric Liveness Check
        </button>
      )}
    </div>
  );
};
