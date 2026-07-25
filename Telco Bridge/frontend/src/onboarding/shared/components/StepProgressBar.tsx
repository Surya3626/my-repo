import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { OnboardingStep, Channel } from '../state/onboardingMachine';
import { getUiSteps, getUiStepIndex, getTotalUiSteps, STEP_META, canNavigateTo } from '../state/onboardingMachine';
import type { JourneyStatus } from '../state/onboardingMachine';

interface StepProgressBarProps {
  channel: Channel;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  journeyStatus: JourneyStatus;
  isPostConsent: boolean;
  onStepClick?: (step: OnboardingStep) => void;
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  channel,
  currentStep,
  completedSteps,
  journeyStatus,
  isPostConsent,
  onStepClick,
}) => {
  const uiSteps = getUiSteps(channel);
  const currentIndex = getUiStepIndex(channel, currentStep);
  const total = getTotalUiSteps(channel);
  const progressPct = Math.max(10, Math.min(100, Math.round(((currentIndex - 1) / (total - 1)) * 100)));

  return (
    <div className="clay-card p-5 space-y-4">
      {/* Active Step Focus Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl clay-button-purple flex items-center justify-center font-black animate-pulse-slow">
            {currentIndex}
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-400 block">
              Onboarding Progress • Step {currentIndex} of {total}
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              {STEP_META[currentStep]?.label}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1 text-xs font-black clay-badge-purple">
            {progressPct}% Completed
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-2.5 bg-slate-200 dark:bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-slate-700">
        <div
          className="h-full bg-gradient-to-r from-tpf-purple via-tpf-pink to-emerald-400 rounded-full transition-all duration-700 shadow-md"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Stepper Nodes */}
      <div className="grid grid-cols-5 md:grid-cols-10 gap-1.5 pt-1">
        {uiSteps.map((step, idx) => {
          const isCompleted = completedSteps.includes(step);
          const isCurrent = step === currentStep;
          const isClickable = isCompleted && canNavigateTo(channel, journeyStatus, step, completedSteps, isPostConsent);

          return (
            <button
              key={step}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick?.(step)}
              className={`flex flex-col items-center gap-1 group transition ${
                isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
              }`}
              title={`${STEP_META[step].shortLabel}${!isClickable && isCompleted ? ' (Locked after Consent)' : isClickable ? ' (Click to revisit)' : ''}`}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-300 ${
                  isCurrent
                    ? 'bg-gradient-to-r from-tpf-purple to-tpf-pink text-white shadow-lg shadow-purple-500/40 ring-4 ring-purple-500/30 scale-110 animate-pulse-glow'
                    : isCompleted
                    ? isPostConsent && canNavigateTo(channel, journeyStatus, step, completedSteps, isPostConsent) === false
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                      : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 animate-pop-bounce'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-800'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`text-[9px] font-bold tracking-tight truncate max-w-full hidden sm:block ${
                  isCurrent
                    ? 'text-purple-700 dark:text-purple-300 font-black'
                    : isCompleted && isClickable
                    ? 'text-slate-800 dark:text-slate-300 group-hover:text-tpf-purple'
                    : 'text-slate-600 dark:text-slate-500'
                }`}
              >
                {STEP_META[step].shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
