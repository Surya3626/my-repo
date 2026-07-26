import React, { useEffect, useState } from 'react';
import { 
  Sparkles, CheckCircle2, ShieldCheck, Zap, Radio, 
  MapPin, UserCheck, FileCheck, Building, FileText, Server, ArrowRight
} from 'lucide-react';
import { STEP_META, type OnboardingStep } from '../state/onboardingMachine';

interface StepTransitionOverlayProps {
  isVisible: boolean;
  fromStep: OnboardingStep;
  toStep: OnboardingStep;
  currentIndex: number;
  totalSteps: number;
}

const STEP_TRANSITION_DETAILS: Record<OnboardingStep, {
  milestoneTitle: string;
  subtitle: string;
  highlights: [string, string, string];
  gradient: string;
  iconName: string;
}> = {
  FEASIBILITY_CHECK: {
    milestoneTitle: 'Coverage Feasibility Confirmed',
    subtitle: 'Ultra-fast FTTH Gigabit broadband available at your location!',
    highlights: ['1000 Mbps Feasible', 'Gigabit Optical Path', 'Zero Latency Core'],
    gradient: 'from-purple-600 via-indigo-600 to-pink-600',
    iconName: 'MapPin',
  },
  CUSTOMER_DETAILS: {
    milestoneTitle: 'Subscriber Booking Profile Created',
    subtitle: 'Contact identity & primary entity records established.',
    highlights: ['Identity Profile Saved', 'OTP Dispatch Prepared', 'Subscriber Account ID Set'],
    gradient: 'from-blue-600 via-purple-600 to-indigo-600',
    iconName: 'UserCheck',
  },
  OTP_VERIFICATION: {
    milestoneTitle: 'Mobile Number Authenticated',
    subtitle: '2FA OTP validated against telecom subscriber gateway.',
    highlights: ['Mobile Authorized', 'SelfCare Access Linked', '256-Bit Encrypted'],
    gradient: 'from-emerald-600 via-teal-600 to-purple-600',
    iconName: 'ShieldCheck',
  },
  DOCUMENT_COLLECTION: {
    milestoneTitle: 'E-KYC Documents Vaulted',
    subtitle: 'Identity proof uploaded to encrypted regulatory repository.',
    highlights: ['Aadhaar/PAN Encrypted', 'DoT Compliance Active', 'Digital Vault Sealed'],
    gradient: 'from-indigo-600 via-purple-600 to-pink-600',
    iconName: 'FileCheck',
  },
  BUILD_PROFILE: {
    milestoneTitle: 'Billing & Installation Address Set',
    subtitle: 'Premise address & billing cycle preferences configured.',
    highlights: ['Installation Address Locked', 'Billing Cycle Synced', 'Tax Category Set'],
    gradient: 'from-purple-600 via-indigo-600 to-teal-600',
    iconName: 'Building',
  },
  PLANS_ADDONS_COUPONS: {
    milestoneTitle: 'Broadband Plan & Offers Locked',
    subtitle: 'Selected fiber plan, Binge OTT benefits & discount code applied!',
    highlights: ['Bandwidth Reserved', 'Binge OTT Benefits Active', 'Promo Savings Applied'],
    gradient: 'from-pink-600 via-purple-600 to-indigo-600',
    iconName: 'Zap',
  },
  PAYMENT: {
    milestoneTitle: 'Order Payment & Order Settlement Authorized',
    subtitle: 'PCI-DSS transaction approved. Telecom IDs generated.',
    highlights: ['Payment Verified', 'Account Number Issued', 'Connection ID Assigned'],
    gradient: 'from-emerald-600 via-teal-600 to-indigo-600',
    iconName: 'CheckCircle2',
  },
  DOCUMENT_MIGRATION: {
    milestoneTitle: 'Central Core Storage Synced',
    subtitle: 'Migrating records to telecom provisioning engine.',
    highlights: ['Provisioning Synced', 'Central Store Vaulted', 'Audit Trail Recorded'],
    gradient: 'from-blue-600 to-purple-600',
    iconName: 'Server',
  },
  CUSTOMER_CONSENT: {
    milestoneTitle: 'Digital Consent & E-Signature Recorded',
    subtitle: 'TRAI regulatory disclosures & SLA agreements signed.',
    highlights: ['E-Signature Logged', 'TRAI SLA Guarantee', 'Legal CAF Ready'],
    gradient: 'from-purple-600 via-pink-600 to-emerald-600',
    iconName: 'CheckCircle2',
  },
  CAF_GENERATION: {
    milestoneTitle: 'Official CAF Application Generated',
    subtitle: 'Customer Application Form archived with unique serial ID.',
    highlights: ['CAF Serial Issued', 'DoT PDF Archived', 'Doorstep Ready'],
    gradient: 'from-indigo-600 via-purple-600 to-pink-600',
    iconName: 'FileText',
  },
  EKYC_INITIATION: {
    milestoneTitle: 'Doorstep Engineer Appointment Active',
    subtitle: 'Technician dispatched! Live GPS tracking activated on map.',
    highlights: ['Field Engineer Dispatched', 'Live GPS Tracking Active', 'Wi-Fi 6 Router Allocated'],
    gradient: 'from-emerald-600 via-teal-600 to-purple-600',
    iconName: 'Radio',
  },
};

export const StepTransitionOverlay: React.FC<StepTransitionOverlayProps> = ({
  isVisible,
  fromStep,
  toStep,
  currentIndex,
  totalSteps,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 12;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const fromDetail = STEP_TRANSITION_DETAILS[fromStep] || STEP_TRANSITION_DETAILS.FEASIBILITY_CHECK;
  const toMeta = STEP_META[toStep] || { label: 'Next Step', shortLabel: 'Next' };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/70 dark:bg-slate-950/85 backdrop-blur-xl animate-fade-in text-center select-none">
      
      {/* Background Fiber Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:24px_24px] opacity-20 animate-pulse-slow pointer-events-none" />

      {/* Portal Claymorphism Step Milestone Modal */}
      <div className="relative w-full max-w-lg clay-modal p-8 border-2 border-purple-500/40 rounded-3xl bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white space-y-6 shadow-2xl animate-pop-bounce overflow-hidden">
        
        {/* Top Animated Fiber Laser Beam */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-600 via-pink-500 to-emerald-400 animate-fiber-beam shadow-[0_0_20px_rgba(168,85,247,0.6)]" />

        {/* Milestone Icon & Step Transition Counter */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/40 border-t-purple-500 border-r-pink-500 animate-spin" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-2 rounded-full border border-emerald-400/30 animate-ping" />

            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${fromDetail.gradient} text-white flex items-center justify-center shadow-xl z-10 animate-victory-burst`}>
              <CheckCircle2 size={30} className="animate-pulse" />
            </div>
          </div>

          <span className="clay-badge-purple px-3.5 py-1 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
            <Sparkles size={12} className="text-pink-500 dark:text-pink-400 animate-pulse" />
            MILESTONE COMPLETED • STEP {currentIndex - 1 || 1} OF {totalSteps}
          </span>
        </div>

        {/* Milestone Title & Meaningful Summary */}
        <div className="space-y-2">
          <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
            ✓ {fromDetail.milestoneTitle}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-md mx-auto">
            {fromDetail.subtitle}
          </p>
        </div>

        {/* 3 Milestone Verification Highlights */}
        <div className="grid grid-cols-3 gap-2.5 pt-1 text-[9.5px]">
          {fromDetail.highlights.map((item, idx) => (
            <div key={idx} className="p-2.5 rounded-2xl clay-card text-slate-800 dark:text-slate-200 font-extrabold flex items-center justify-center gap-1.5 shadow-sm">
              <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">{item}</span>
            </div>
          ))}
        </div>

        {/* Next Step Target Bar */}
        <div className="p-3.5 rounded-2xl clay-card border-2 border-purple-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-left">
            <Radio size={18} className="text-purple-600 dark:text-purple-400 animate-pulse shrink-0" />
            <div>
              <span className="text-[9px] text-slate-500 dark:text-purple-300 font-black uppercase tracking-wider block">Transitioning To Step {currentIndex}</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-xs block">{toMeta.label}</span>
            </div>
          </div>
          <ArrowRight size={18} className="text-purple-600 dark:text-purple-400 animate-bounce" />
        </div>

        {/* Progress Bar Track */}
        <div className="space-y-1">
          <div className="w-full h-3 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-emerald-400 rounded-full transition-all duration-150 shadow-md"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
