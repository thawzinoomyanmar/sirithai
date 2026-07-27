import React, { useState } from 'react';
import { DialogueLine, QuizQuestion } from '../types';
import { Check, X, Award, HelpCircle, ArrowRight, Volume2, Volume1, Volume, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isSingleSentenceEnglish } from '../utils/sentenceUtils';

interface QuizViewProps {
  questions: QuizQuestion[];
  lessonId: number;
  dialogue: DialogueLine[];
  onWordMastered: (word: string) => void;
  masteredWords: string[];
  onQuizFinished: (scorePercentage: number, xpGained: number) => void;
  audioSpeedIndex: number;
  setAudioSpeedIndex: React.Dispatch<React.SetStateAction<number>>;
}

export default function QuizView({
  questions,
  lessonId,
  dialogue,
  onWordMastered,
  masteredWords,
  onQuizFinished,
  audioSpeedIndex,
  setAudioSpeedIndex
}: QuizViewProps) {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [showResults, setShowResults] = useState<boolean>(false);

  const activeQuestion = questions[currentIdx];

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;
    setSelectedAnswer(option);
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === activeQuestion.correctAnswer) {
      setCorrectCount(correctCount + 1);
    }
    setIsAnswered(true);
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Cycle shared speed index
    const nextIndex = (audioSpeedIndex + 1) % 3;
    setAudioSpeedIndex(nextIndex);

    const rates = [0.85, 0.7, 0.5];
    const rate = rates[nextIndex];

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
      const scorePercentage = Math.round((correctCount / questions.length) * 100);
      // Gained XP = correct answers * 20 XP
      const xpGained = correctCount * 20;
      onQuizFinished(scorePercentage, xpGained);
    }
  };

  const handleRetry = () => {
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setCorrectCount(0);
    setShowResults(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" id="quiz-view">
      
      <AnimatePresence mode="wait">
        <motion.div
          key={showResults ? "results" : "quiz"}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="duo-card max-w-2xl mx-auto bg-white overflow-hidden shadow-sm animate-fade-in"
        >
          {!showResults ? (
            <div className="p-4 sm:p-6 md:p-8">
              {/* Header / Tracker */}
              <div className="flex justify-between items-center text-xs font-sans mb-6 text-brand-muted">
                <span className="font-sans font-extrabold text-[#fff] bg-brand-purple px-3 py-1 rounded-full border-b-2 border-brand-purple-shadow flex items-center gap-1">
                  QUIZ CHALLENGE • အကဲဖြတ်စစ်ဆေးခြင်း
                </span>
                <span className="font-extrabold text-brand-purple bg-brand-purple-light px-3 py-1 rounded-full">
                  Question {currentIdx + 1} / {questions.length}
                </span>
              </div>

              {/* Listening Challenge Button specifically if it's a listening challenge */}
              {activeQuestion.type === 'listening-match' && (
                <div className="duo-card bg-brand-purple-light/25 border-brand-purple/20 p-6 text-center mb-6 flex flex-col items-center">
                  {audioSpeedIndex === 0 ? (
                    <Volume2 className="w-11 h-11 text-brand-purple mb-2" />
                  ) : audioSpeedIndex === 1 ? (
                    <Volume1 className="w-11 h-11 text-indigo-500 mb-2" />
                  ) : (
                    <Volume className="w-11 h-11 text-orange-500 mb-2" />
                  )}
                  <h4 className="text-sm font-sans font-black text-brand-purple uppercase">Listening Challenge • အသံထွက်နားထောင်ပါ</h4>
                  <p className="text-xs text-brand-muted font-sans font-semibold mt-0.5">Click speaking device to hear standard vocalization</p>
                  <button
                    onClick={() => speakText(activeQuestion.promptThai || '')}
                    className="mt-4 duo-btn duo-btn-purple px-5 py-2.5 text-xs flex items-center gap-2 font-bold shadow-md transition-all active:scale-95"
                    title={`Listen (${audioSpeedIndex === 0 ? "Normal" : audioSpeedIndex === 1 ? "Slow 0.7x" : "Slower 0.5x"})`}
                  >
                    {audioSpeedIndex === 0 ? (
                      <>
                        <Volume2 className="w-4 h-4 text-white fill-current animate-pulse-slow" />
                        <span>Listen to voice (1.0x) • အသံနားထောင်မည်</span>
                      </>
                    ) : audioSpeedIndex === 1 ? (
                      <>
                        <Volume1 className="w-4 h-4 text-white fill-current animate-pulse-slow" />
                        <span>Listen to voice (0.7x) • အသံနားထောင်မည်</span>
                      </>
                    ) : (
                      <>
                        <Volume className="w-4 h-4 text-white fill-current animate-pulse-slow" />
                        <span>Listen to voice (0.5x) • အသံနားထောင်မည်</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Prompt */}
              <h3 className="text-lg md:text-xl font-sans font-black text-brand-dark mb-6 leading-tight">
                {activeQuestion.prompt}
              </h3>

              {/* Options grid */}
              <div className="space-y-3 mb-8">
                {activeQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === activeQuestion.correctAnswer;
                  const isIncorrect = isSelected && !isCorrect;

                  let optClass = "bg-white border-[#e5e5e5] border-b-4 hover:bg-gray-50 text-brand-dark";
                  if (isAnswered) {
                    if (isCorrect) {
                      optClass = "duo-card-success border-b-brand-green-shadow text-brand-green font-black";
                    } else if (isIncorrect) {
                      optClass = "bg-red-50 border-red-300 border-b-red-500 text-red-600 line-through font-semibold";
                    } else {
                      optClass = "bg-white border-gray-100 text-brand-muted opacity-40";
                    }
                  } else if (isSelected) {
                    optClass = "duo-card-active border-b-brand-purple-shadow text-brand-purple font-black";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(option)}
                      className={`duo-card w-full text-left p-4 sm:p-5 text-sm font-bold flex items-center justify-between transition-all ${optClass}`}
                    >
                      <span>{option}</span>
                      {isAnswered && (
                        isCorrect ? (
                          <Check className="w-5 h-5 text-brand-green font-black" />
                        ) : isIncorrect ? (
                          <X className="w-5 h-5 text-red-600 font-black" />
                        ) : null
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Navigation / Action */}
              <div className="flex justify-end border-t border-brand-border pt-6">
                {!isAnswered ? (
                  <button
                    disabled={!selectedAnswer}
                    onClick={handleCheckAnswer}
                    className={`duo-btn text-xs px-6 py-3 flex items-center gap-2 ${
                      !selectedAnswer
                        ? 'duo-btn-disabled'
                        : 'duo-btn-purple'
                    }`}
                    id="btn-quiz-check"
                  >
                    Verify Answer • မေးခွန်းဖြေမည်
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className={`duo-btn text-xs px-6 py-3 flex items-center gap-2 ${
                      currentIdx === questions.length - 1
                        ? 'duo-btn-green'
                        : 'duo-btn-purple'
                    }`}
                    id="btn-quiz-next"
                  >
                    {currentIdx === questions.length - 1 ? 'Finish Exam • ပြီးဆုံးသည်' : 'Continue • နောက်တစ်ပုဒ်'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Answer Explanations under checked answer */}
              <AnimatePresence>
                {isAnswered && (activeQuestion.explanation || activeQuestion.explanationMyanmar) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-6 border-t border-brand-border pt-6"
                  >
                    <div className="duo-card p-5 bg-brand-purple-light/40 border-brand-purple/10 flex items-start gap-4">
                      <HelpCircle className="w-6 h-6 text-brand-purple mt-0.5" />
                      <div>
                        <h5 className="text-xs font-sans font-black text-[#3a1a68] uppercase tracking-wide">Grammar Insight • သဒ္ဒါရှင်းလင်းချက်</h5>
                        {activeQuestion.explanation && isSingleSentenceEnglish(activeQuestion.explanation) && (
                          <p className="text-xs text-brand-dark font-sans font-semibold mt-1.5 leading-relaxed">{activeQuestion.explanation}</p>
                        )}
                        {activeQuestion.explanationMyanmar && (
                          <p className="text-xs text-brand-muted font-sans mt-2 leading-relaxed italic font-bold border-l-2 border-brand-purple/20 pl-3">{activeQuestion.explanationMyanmar}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Results Dashboard */
            <div className="p-8 text-center" id="quiz-results">
              <div className="w-20 h-20 bg-brand-purple text-white rounded-full flex items-center justify-center mx-auto mb-6 border-b-4 border-brand-purple-shadow shadow-xs">
                <Award className="w-10 h-10 animate-spin" style={{ animationDuration: '8s' }} />
              </div>

              <h3 className="text-xl md:text-2xl font-sans font-black text-[#3a1a68] tracking-tight uppercase">
                Exam Complete! • စာမေးပွဲပြီးသွားပါပြီ
              </h3>
              <p className="text-xs text-brand-muted font-sans mt-1 font-semibold">
                Lesson Evaluation achievements updated offline • သင်ခန်းစာလေ့ကျင့်မှုရမှတ်
              </p>

              {/* Performance Stats */}
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 my-8 max-w-sm mx-auto">
                <div className="duo-card p-4 bg-white shadow-xs">
                  <div className="text-3xl font-sans font-black text-[#3a1a68] leading-none">
                    {correctCount} <span className="text-sm font-sans text-brand-muted font-normal">/ {questions.length}</span>
                  </div>
                  <div className="text-[10px] font-sans text-brand-muted uppercase font-black tracking-wider mt-1.5">Correct Answers</div>
                </div>

                <div className="duo-card p-4 bg-brand-green-light border-brand-green/20 shadow-xs">
                  <div className="text-3xl font-sans font-black text-brand-green leading-none">
                    +{correctCount * 20} <span className="text-sm font-sans text-brand-muted font-normal">XP</span>
                  </div>
                  <div className="text-[10px] font-sans text-brand-muted uppercase font-black tracking-wider mt-1.5">XP Gained</div>
                </div>
              </div>

              {/* Feedback based on score */}
              <div className="text-sm font-sans text-brand-dark max-w-sm mx-auto mt-2 leading-relaxed font-bold">
                {correctCount === questions.length ? (
                  <span className="text-brand-green font-extrabold uppercase">Perfect evaluation score! Masterfully done!</span>
                ) : correctCount >= questions.length / 2 ? (
                  <span className="text-brand-purple font-bold">Solid basic course knowledge. Keep learning!</span>
                ) : (
                  <span className="text-brand-muted font-bold">Good try. Practice correct sequences to cement these syntax rules.</span>
                )}
              </div>

              <div className="flex justify-center gap-4 mt-8 border-t border-brand-border pt-6">
                <button
                  onClick={handleRetry}
                  className="duo-btn duo-btn-white text-xs px-5 py-2.5 flex items-center gap-2 hover:text-brand-purple hover:border-brand-purple-hover"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Quiz • ပြန်လည်ဖြေဆိုရန်
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
