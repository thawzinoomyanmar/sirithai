import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, ChevronRight } from 'lucide-react';
import { Lesson } from '../types';

interface LessonItemProps {
  lesson: Lesson;
  isCompleted: boolean;
  score: number;
  getMyanmarPhonetic: (phonetic: string) => string;
  onClick: (lessonId: string) => void;
}

export const LessonItem: React.FC<LessonItemProps> = React.memo(({
  lesson,
  isCompleted,
  score,
  getMyanmarPhonetic,
  onClick
}) => {
  return (
    <motion.div
      className="duo-card p-6 bg-white flex flex-col justify-between hover:shadow-md transition-all duration-200 cursor-pointer"
      whileHover={{ y: -2 }}
      onClick={() => onClick(lesson.id)}
    >
      <div>
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-sans text-white bg-brand-purple px-2.5 py-1 rounded-full border-b-2 border-brand-purple-shadow font-extrabold select-none">
            LESSON {lesson.id}
          </span>
          {isCompleted && (
            <span className="flex items-center gap-1 text-[10px] text-white bg-brand-green px-2.5 py-1 rounded-full font-black font-sans border-b-2 border-brand-green-shadow">
              Complete • အောင်မြင်သည်
            </span>
          )}
        </div>

        <h4 className="text-sm font-sans font-black text-[#3c3c3c] mt-4 leading-tight">
          {lesson.titleEnglish}
        </h4>
        <p className="text-xs font-sans text-brand-green font-extrabold mt-1" style={{ wordBreak: 'break-word' }}>
          <span className="italic">{lesson.titlePhonetic}</span> ({lesson.titleThai})
        </p>
        {lesson.titlePhonetic && (
          <p className="text-[10px] font-sans text-emerald-600 font-extrabold mt-0.5 select-none opacity-90">
            အသံထွက်: {getMyanmarPhonetic(lesson.titlePhonetic)}
          </p>
        )}

        <p className="text-[11px] text-brand-muted font-sans mt-3 line-clamp-2 leading-relaxed font-bold">
          {lesson.descriptionMyanmar}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50 -mx-6 -mb-6 p-4 rounded-b-2xl">
        <span className="text-[10px] font-sans text-brand-muted font-extrabold tracking-wider uppercase">
          SCORE: {score}%
        </span>
        <button
          onClick={() => onClick(lesson.id)}
          className="duo-btn duo-btn-purple text-xs px-4 py-2.5 flex items-center gap-1.5 font-bold"
        >
          Study Lesson • လေ့လာမည်
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
});
