import React from 'react';
import { Lock, CheckCircle2 } from 'lucide-react';

interface AdvanceComponentProps {
  isLoggedIn: boolean;
  onOpenEnrollment: (course: { title: string; price: string; type: string }) => void;
  onNavigateLogin?: () => void;
}

export const AdvanceComponent: React.FC<AdvanceComponentProps> = ({
  isLoggedIn,
  onOpenEnrollment,
  onNavigateLogin
}) => {
  const handleUnlockClick = () => {
    if (!isLoggedIn) {
      alert('Please login to enroll in premium courses.');
      if (onNavigateLogin) {
        onNavigateLogin();
      }
      return;
    }
    onOpenEnrollment({
      title: "Advanced Business Thai Speaking",
      price: "35,000",
      type: "PREMIUM COURSE"
    });
  };

  return (
    <div className="duo-card p-6 sm:p-8 bg-white border-2 border-purple-100 rounded-3xl shadow-sm space-y-6 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-sans font-black uppercase tracking-widest bg-brand-purple/10 text-brand-purple px-3 py-1 rounded-full">
          Advanced Business Curriculum
        </span>
        <span className="text-xs font-mono font-black text-brand-purple bg-purple-50 px-2.5 py-1 rounded-lg">
          35,000 MMK
        </span>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl sm:text-2xl font-sans font-black text-slate-900 leading-tight">
          Advanced Business Thai Speaking & Letters Course
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
          Master formal business communication, negotiations, official emails, and advanced Thai sentence structures with Kru Jane.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>35 Advanced Video Masterclasses</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Workplace Email & Letter Templates</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Native Audio & Speech Drills</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Verified Certificate of Completion</span>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Course Fee</span>
          <span className="text-xl font-sans font-black text-brand-purple">35,000 MMK</span>
        </div>

        <button
          type="button"
          onClick={handleUnlockClick}
          className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-brand-purple to-purple-700 hover:brightness-110 text-white rounded-2xl text-xs font-sans font-black uppercase tracking-wider shadow-md hover:shadow-lg cursor-pointer transition-all active:scale-95 border-b-4 border-purple-900 flex items-center justify-center gap-2"
        >
          <Lock className="w-4 h-4" />
          <span>🔓 UNLOCK COURSE NOW</span>
        </button>
      </div>
    </div>
  );
};
