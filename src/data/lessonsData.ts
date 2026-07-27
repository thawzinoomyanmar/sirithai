import { Lesson } from '../types';
import { lessons1to5 } from './lessons1to5';
import { lessons6to10 } from './lessons6to10';
import { lessons11to15 } from './lessons11to15';
import { lessons16to20 } from './lessons16to20';
import { lessons21to25 } from './lessons21to25';
import { lessons26to29 } from './lessons26to29';
import { lessons30to32 } from './lessons30to32';
import { lessons33to43 } from './lessons33to43';
import { expandLessonQuizzes } from '../utils/quizGenerator';
import { expandLessonGrammar } from '../utils/grammarGenerator';

const rawLessons: Lesson[] = [
  ...lessons1to5,
  ...lessons6to10,
  ...lessons11to15,
  ...lessons16to20,
  ...lessons21to25,
  ...lessons26to29,
  ...lessons30to32,
  ...lessons33to43
];

export const lessonsData: Lesson[] = expandLessonGrammar(expandLessonQuizzes(rawLessons));


