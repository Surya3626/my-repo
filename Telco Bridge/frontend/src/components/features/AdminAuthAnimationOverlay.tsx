import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, CheckCircle2, Radio, Sparkles, Key, LogOut } from 'lucide-react';
import { ConfettiCanvas } from './ConfettiCanvas';

interface AdminAuthAnimationOverlayProps {
  mode: 'LOGIN' | 'LOGOUT' | null;
  username?: string;
}

export const AdminAuthAnimationOverlay: React.FC<AdminAuthAnimationOverlayProps> = ({ mode, username = 'Operations Admin' }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!mode) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 15;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [mode]);

  if (!mode) return null;

  const isLogin = mode === 'LOGIN';

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/70 dark:bg-slate-950/85 backdrop-blur-xl animate-fade-in text-center select-none">
      
      {/* Confetti Explosion on Login Success */}
      {isLogin && <ConfettiCanvas />}

      {/* Portal Radial Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:24px_24px] opacity-20 animate-pulse-slow pointer-events-none" />

      {/* Portal Claymorphism Auth Modal */}
      <div className="relative w-full max-w-md clay-modal p-8 border-2 border-purple-500/40 rounded-3xl bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white space-y-6 shadow-2xl animate-pop-bounce overflow-hidden">
        
        {/* Portal Top Fiber Beam */}
        <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${isLogin ? 'from-purple-600 via-pink-500 to-emerald-400' : 'from-rose-600 via-amber-500 to-purple-600'} animate-fiber-beam shadow-[0_0_20px_rgba(168,85,247,0.6)]`} />

        {/* 3D Security Clearance Ring */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full border-2 ${isLogin ? 'border-emerald-500/40 border-t-emerald-500' : 'border-rose-500/40 border-t-rose-500'} animate-spin`} style={{ animationDuration: '2.5s' }} />
          <div className={`absolute inset-2 rounded-full border ${isLogin ? 'border-emerald-400/30' : 'border-rose-400/30'} animate-ping`} />

          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${isLogin ? 'from-purple-600 via-indigo-600 to-emerald-500' : 'from-rose-600 via-pink-600 to-purple-600'} text-white flex items-center justify-center shadow-xl z-10 animate-victory-burst`}>
            {isLogin ? <ShieldCheck size={32} className="animate-pulse" /> : <Lock size={32} className="animate-pulse" />}
          </div>
        </div>

        {/* Status Headings & Badges */}
        <div className="space-y-2">
          <span className={`inline-flex px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest items-center gap-1.5 shadow-sm ${
            isLogin ? 'clay-badge-emerald' : 'clay-badge-rose'
          }`}>
            <Radio size={12} className="animate-pulse" />
            {isLogin ? 'BIOMETRIC CLEARANCE LEVEL 1 GRANTED' : 'SESSION TERMINATION & LOCK'}
          </span>

          <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
            {isLogin ? 'Admin Authenticated!' : 'Admin Session Locked'}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-300 font-medium leading-relaxed">
            {isLogin 
              ? `Welcome back, ${username}! Unlocking Onboarding Operations Console & GIS Engine...` 
              : `Safely logging out ${username}. Encrypting ephemeral session keys...`}
          </p>
        </div>

        {/* Live Portal Status Badges */}
        <div className="grid grid-cols-2 gap-2.5 text-[10px]">
          <div className="p-3 rounded-2xl clay-card flex items-center justify-center gap-2 font-black text-slate-800 dark:text-slate-200">
            {isLogin ? <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" /> : <LogOut size={16} className="text-rose-500" />}
            <span>{isLogin ? 'Token Authenticated' : 'Token Revoked'}</span>
          </div>
          <div className="p-3 rounded-2xl clay-card flex items-center justify-center gap-2 font-black text-slate-800 dark:text-slate-200">
            <Key size={16} className="text-purple-600 dark:text-purple-400" />
            <span>{isLogin ? '256-Bit Key Active' : 'Keys Purged'}</span>
          </div>
        </div>

        {/* Portal Styled Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-3 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-slate-800">
            <div
              className={`h-full bg-gradient-to-r ${isLogin ? 'from-purple-600 via-pink-500 to-emerald-400' : 'from-rose-600 via-amber-500 to-purple-600'} rounded-full transition-all duration-150 shadow-md`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
