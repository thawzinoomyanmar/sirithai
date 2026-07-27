import { ProgressState } from '../types';
import { Award, Zap, BookOpen, Star, RotateCcw, ShieldCheck, Compass } from 'lucide-react';
import { motion } from 'motion/react';

interface ProgressCardProps {
  progress: ProgressState;
  onReset: () => void;
}

export default function ProgressCard({ progress, onReset }: ProgressCardProps) {
  const completionRate = Math.round((progress.completedLessons.length / 20) * 100);

  return (
    <div id="stats-dashboard" className="duo-card p-4 sm:p-5 mb-5 bg-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-5">
        <div>
          <span className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-[#fff] bg-brand-purple px-2.5 py-0.5 rounded-full border-b-2 border-brand-purple-shadow">
            STUDENT STATUS • ကျောင်းသားအခြေအနေ
          </span>
          <h2 className="text-lg sm:text-xl font-sans font-black text-brand-dark mt-2 tracking-tight">
            Learning Progress • သင်ယူမှုမှတ်တမ်း
          </h2>
          <p className="text-xs text-brand-muted font-sans font-medium mt-1 animate-pulse">
            Structured Thai grammar lessons scaffolded for Myanmar learners in Thailand • ထိုင်း-မြန်မာ အခြေခံဘာသာစကား လေ့လာရေး
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm("Are you sure you want to reset your progress? This will clear mastered words and scores. \n\nသင်ယူမှုမှတ်တမ်းအားလုံးကို ဖျက်ပစ်ရန် သေချာပါသလား။")) {
              onReset();
            }
          }}
          className="duo-btn duo-btn-white text-[11px] px-3.5 py-2 flex items-center gap-2 text-brand-muted hover:text-red-500 hover:border-red-400 active:translate-y-0.5 w-full md:w-auto justify-center"
          id="btn-progress-reset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Stats • အသစ်ပြန်စရန်
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Streak */}
        <motion.div 
          className="duo-card p-3 flex items-center gap-2 hover:scale-[1.01] cursor-pointer"
          whileHover={{ y: -1 }}
        >
          <div className="p-2 bg-amber-50 border-2 border-amber-200 text-amber-500 rounded-xl shadow-xs shrink-0">
            <Zap className="w-4 h-4 fill-current animate-bounce" />
          </div>
          <div className="min-w-0">
            <div className="text-lg sm:text-xl font-sans font-black text-brand-dark leading-none">{progress.streak}</div>
            <div className="text-[10px] sm:text-[11px] font-bold text-brand-muted font-sans mt-0.5 truncate">Day Streak</div>
            <div className="text-[9px] text-brand-muted font-sans font-medium truncate">ရက်တိုက်မပျက်လေ့လာမှု</div>
          </div>
        </motion.div>

        {/* XP */}
        <motion.div 
          className="duo-card p-3 flex items-center gap-2 hover:scale-[1.01] cursor-pointer"
          whileHover={{ y: -1 }}
        >
          <div className="p-2 bg-purple-50 border-2 border-purple-200 text-brand-purple rounded-xl shadow-xs shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-lg sm:text-xl font-sans font-black text-brand-dark leading-none">{progress.totalXp}</div>
            <div className="text-[10px] sm:text-[11px] font-bold text-brand-muted font-sans mt-0.5 truncate">Study XP</div>
            <div className="text-[9px] text-brand-muted font-sans font-medium truncate">မှတ်ပိုင့်ရမှတ်စုစုပေါင်း</div>
          </div>
        </motion.div>

        {/* Lessons Completed */}
        <motion.div 
          className="duo-card p-3 flex items-center gap-2 hover:scale-[1.01] cursor-pointer"
          whileHover={{ y: -1 }}
        >
          <div className="p-2 bg-emerald-50 border-2 border-emerald-200 text-brand-green rounded-xl shadow-xs shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-lg sm:text-xl font-sans font-black text-brand-dark leading-none truncate">
              {progress.completedLessons.length} <span className="text-xs font-sans text-brand-muted font-normal">/ 20</span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-bold text-brand-muted font-sans mt-0.5 truncate">Lessons Done</div>
            <div className="text-[9px] text-brand-muted font-sans font-medium truncate">ပြီးဆုံးသည့်သင်ခန်းစာ</div>
          </div>
        </motion.div>

        {/* Words Mastered */}
        <motion.div 
          className="duo-card p-3 flex items-center gap-2 hover:scale-[1.01] cursor-pointer"
          whileHover={{ y: -1 }}
        >
          <div className="p-2 bg-blue-50 border-2 border-blue-200 text-blue-500 rounded-xl shadow-xs shrink-0">
            <Star className="w-4 h-4 fill-current animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="text-lg sm:text-xl font-sans font-black text-brand-dark leading-none">{progress.masteredWords.length}</div>
            <div className="text-[10px] sm:text-[11px] font-bold text-brand-muted font-sans mt-0.5 truncate">Words Mastered</div>
            <div className="text-[9px] text-brand-muted font-sans font-medium truncate">မှတ်မိပြီးစကားလုံးစုစုပေါင်း</div>
          </div>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4.5 duo-card p-4 bg-brand-purple-light/50 border-brand-purple/20">
        <div className="flex justify-between items-center text-xs font-sans mb-2 select-none">
          <span className="font-extrabold text-[#3a1a68] flex items-center gap-1.5 uppercase">
            <ShieldCheck className="w-4.5 h-4.5 text-brand-purple" />
            Course Mastery • အခြေခံထိုင်းစကား ပြီးမြောက်မှု
          </span>
          <span className="font-mono text-brand-purple font-black text-sm">{completionRate}%</span>
        </div>
        <div className="w-full bg-[#e5e5e5] rounded-full h-3 overflow-hidden shadow-inner border border-brand-border">
          <motion.div 
            className="bg-brand-purple h-full rounded-full shadow-md"
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-brand-muted font-sans mt-2.5">
          <span className="font-medium">Lessons completed grant bonus study achievements</span>
          <span className="flex items-center gap-1 font-semibold text-brand-purple select-none">
            <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            100% Offline Studying Ready • အော့ဖ်လိုင်း ဆက်လက်လေ့လာနိုင်သည်
          </span>
        </div>
      </div>
    </div>
  );
}
