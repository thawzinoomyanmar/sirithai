import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, ChevronRight } from 'lucide-react';
import { Lesson } from '../types';
import { useLanguage } from '../utils/LanguageContext';

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
  const { language, t } = useLanguage();
  const titleMyanmar = lesson.titleMyanmar || (lesson as any).title_myanmar || '';
  const titleMyanmarPhonetic = lesson.titleMyanmarPhonetic || (lesson as any).title_myanmar_phonetic || '';
  const descriptionText = lesson.description || lesson.descriptionMyanmar || lesson.descriptionEnglish || (lesson as any).detail_description || '';
  const displayDesc = descriptionText && descriptionText !== titleMyanmar ? descriptionText : '';

  return (
    <motion.div
      className="duo-card p-6 bg-white flex flex-col justify-between hover:shadow-md transition-all duration-200 cursor-pointer h-auto text-left relative overflow-hidden"
      whileHover={{ y: -2 }}
      onClick={() => onClick(String(lesson.id))}
    >
      <div className="flex-1 flex flex-col gap-2 min-h-[150px]">
        <div className="flex justify-between items-start mb-1">
          <span className="text-[10px] font-sans text-white bg-brand-purple px-2.5 py-1 rounded-full border-b-2 border-brand-purple-shadow font-extrabold select-none">
            {t('lesson.label')} {lesson.id}
          </span>
          {isCompleted && (
            <span className="flex items-center gap-1 text-[10px] text-white bg-brand-green px-2.5 py-1 rounded-full font-black font-sans border-b-2 border-brand-green-shadow">
              {t('lesson.complete')}
            </span>
          )}
        </div>

        <h4 className="text-base sm:text-lg font-sans font-black text-[#3c3c3c] mt-2 leading-tight">
          {language === 'my' ? (titleMyanmar || lesson.titleEnglish) : lesson.titleEnglish}
        </h4>
        <p className="text-sm sm:text-base font-sans text-brand-green font-extrabold mt-0.5 leading-relaxed" style={{ wordBreak: 'break-word' }}>
          <span className="italic">{lesson.titlePhonetic}</span> ({lesson.titleThai})
        </p>
        {(titleMyanmarPhonetic || lesson.titlePhonetic) && (
          <p className="text-base sm:text-lg font-sans text-emerald-600 font-black mt-0.5 select-none leading-relaxed">
            {t('lesson.pronunciation')}: {titleMyanmarPhonetic || getMyanmarPhonetic(lesson.titlePhonetic)}
          </p>
        )}

        {language === 'en' && titleMyanmar && (
          <p className="mt-3 text-gray-700 text-base sm:text-lg leading-relaxed font-medium">
            {titleMyanmar}
          </p>
        )}

        {displayDesc && (language === 'my' ? lesson.descriptionMyanmar : lesson.descriptionEnglish) && (
          <p className="mt-2 text-gray-600 text-xs leading-relaxed">
            {language === 'my' ? lesson.descriptionMyanmar : lesson.descriptionEnglish}
          </p>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50 -mx-6 -mb-6 p-4 rounded-b-2xl">
        <span className="text-[10px] font-sans text-brand-muted font-extrabold tracking-wider uppercase">
          {t('lesson.score')}: {score}%
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick(String(lesson.id));
          }}
          className="duo-btn duo-btn-purple text-xs px-4 py-2.5 flex items-center gap-1.5 font-bold"
        >
          {t('lesson.study')}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
});
