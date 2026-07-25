import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface AdminModeTopBarProps {
  agentId: string;
  customerMobile: string;
  onSaveAndExit: () => void;
  isSaving?: boolean;
}

/**
 * Top bar shown in Sales Agent Onboarding Mode.
 * Formerly called "SOC Admin Operational Mode Top Bar".
 */
export const AdminModeTopBar: React.FC<AdminModeTopBarProps> = ({
  agentId,
  customerMobile,
  onSaveAndExit,
  isSaving = false,
}) => {
  return (
    <div className="glass-panel border-2 border-purple-500/40 rounded-2xl p-4 bg-gradient-to-r from-purple-950/40 via-slate-900 to-purple-900/30 flex flex-wrap items-center justify-between gap-4 shadow-lg">
      <div className="flex items-center gap-3 text-left">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold border border-purple-500/30">
          <ShieldCheck size={22} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-purple-400">
              Sales Agent Onboarding Mode
            </span>
            <span className="px-2 py-0.5 bg-purple-500/30 text-white rounded text-[10px] font-bold">
              Agent ID: {agentId}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium">
            Onboarding customer:{' '}
            <span className="font-extrabold text-white">{customerMobile || 'Prospect'}</span>
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onSaveAndExit}
        disabled={isSaving}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl border border-slate-700 shadow flex items-center gap-1.5 transition disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save & Leave Onboarding'}
      </button>
    </div>
  );
};
