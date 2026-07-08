import { z } from "zod"

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

// ── Friends ───────────────────────────────────────────────────────────────────

export const userSearchSchema = z.object({
  q: z
    .string()
    .min(1, "Search query is required")
    .max(50, "Search query is too long")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
})

export const friendRequestSchema = z.object({
  targetUserId: z.string().cuid("Invalid user ID"),
})

export const friendActionSchema = z.object({
  requestId: z.string().cuid("Invalid request ID"),
})

export const friendRemoveSchema = z.object({
  friendUserId: z.string().cuid("Invalid user ID"),
})

// ── Settings ──────────────────────────────────────────────────────────────────

export const changeUsernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(72, "New password is too long")
    .regex(/[A-Z]/, "New password must contain at least one uppercase letter")
    .regex(/[0-9]/, "New password must contain at least one number"),
})

// ── Admin: Lessons ────────────────────────────────────────────────────────────

const VALID_CATEGORIES = ["alphabet", "transliteration", "vocabulary", "grammar", "shlokas"] as const
const VALID_DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const

export const adminLessonSchema = z.object({
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(80, "Slug must be at most 80 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(120, "Title must be at most 120 characters"),
  category: z.enum(VALID_CATEGORIES, { message: "Invalid category" }),
  difficulty: z.enum(VALID_DIFFICULTIES, { message: "Invalid difficulty" }),
  xpReward: z
    .number({ invalid_type_error: "XP reward must be a number" })
    .int("XP reward must be an integer")
    .min(1, "XP reward must be at least 1")
    .max(500, "XP reward must be at most 500"),
  order: z
    .number({ invalid_type_error: "Order must be a number" })
    .int("Order must be an integer")
    .min(0)
    .default(0),
})

export type AdminLessonInput = z.infer<typeof adminLessonSchema>

// ── Admin: Questions ──────────────────────────────────────────────────────────

const VALID_QUESTION_TYPES = ["mcq", "transliterate", "fill_blank"] as const

export const adminQuestionSchema = z.object({
  lessonId: z.string().cuid("Invalid lesson ID"),
  type: z.enum(VALID_QUESTION_TYPES, { message: "Invalid question type" }),
  prompt: z
    .string()
    .min(2, "Prompt must be at least 2 characters")
    .max(500, "Prompt must be at most 500 characters"),
  options: z
    .array(z.string().min(1).max(200))
    .min(2, "MCQ questions require at least 2 options")
    .max(6, "At most 6 options allowed")
    .nullable()
    .optional(),
  correctAnswer: z
    .string()
    .min(1, "Correct answer is required")
    .max(200, "Correct answer must be at most 200 characters"),
  explanation: z
    .string()
    .max(600, "Explanation must be at most 600 characters")
    .nullable()
    .optional(),
  order: z
    .number({ invalid_type_error: "Order must be a number" })
    .int()
    .min(0)
    .default(0),
}).superRefine((data, ctx) => {
  if (data.type === "mcq" && (!data.options || data.options.length < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "MCQ questions require at least 2 options",
      path: ["options"],
    })
  }
})

export const adminQuestionUpdateSchema = adminQuestionSchema.omit({ lessonId: true })

export type AdminQuestionInput = z.infer<typeof adminQuestionSchema>
