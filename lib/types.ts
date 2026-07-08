// Shared types used by both API routes and client components.
// correctAnswer is NEVER included in any type that touches the client before submission.

export interface PublicQuestion {
  id: string
  type: "mcq" | "transliterate" | "fill_blank"
  prompt: string
  options: string[] | null // only present for mcq
  order: number
  // audioUrl intentionally omitted — not implemented yet
}

export interface PublicLesson {
  id: string
  slug: string
  title: string
  category: string
  difficulty: string
  xpReward: number
  questions: PublicQuestion[]
}

export interface LessonSummary {
  id: string
  slug: string
  title: string
  category: string
  difficulty: string
  xpReward: number
  questionCount: number
}

// Returned per-question after the user submits
export interface QuestionResult {
  questionId: string
  prompt: string
  userAnswer: string
  correct: boolean
  correctAnswer: string
  explanation: string | null
}

export interface SubmitResult {
  score: number        // 0–100
  xpEarned: number
  alreadyCompleted: boolean  // true if this lesson was already done — XP not re-awarded
  results: QuestionResult[]
  newAchievements: string[]  // achievement keys newly granted by this submission
}
