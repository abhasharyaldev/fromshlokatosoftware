import { PrismaClient } from "@prisma/client"
import argon2 from "argon2"

const prisma = new PrismaClient()

// ── Lesson + Question data ────────────────────────────────────────────────────
// All categories and lessons are free. There is no premium tier.

const LESSONS = [
  // ── CATEGORY: alphabet ───────────────────────────────────────────────────────
  {
    slug: "devanagari-vowels",
    title: "Devanagari Vowels",
    category: "alphabet",
    difficulty: "beginner",
    xpReward: 40,
    order: 1,
    questions: [
      {
        type: "mcq",
        prompt: "Which letter is this? अ",
        options: ["a", "aa", "i", "u"],
        correctAnswer: "a",
        explanation: "अ (a) is the first and most fundamental vowel in Sanskrit. It sounds like 'a' in 'about'.",
        order: 1,
      },
      {
        type: "mcq",
        prompt: "Which letter is this? आ",
        options: ["a", "aa", "i", "ii"],
        correctAnswer: "aa",
        explanation: "आ (ā) is the long form of अ. It is held twice as long, like 'a' in 'father'.",
        order: 2,
      },
      {
        type: "mcq",
        prompt: "Which letter is this? इ",
        options: ["a", "e", "i", "u"],
        correctAnswer: "i",
        explanation: "इ (i) sounds like 'i' in 'sit'. It is short and quick.",
        order: 3,
      },
      {
        type: "mcq",
        prompt: "Which letter is this? ई",
        options: ["i", "ii", "e", "ai"],
        correctAnswer: "ii",
        explanation: "ई (ī) is the long form of इ. It sounds like 'ee' in 'feet'.",
        order: 4,
      },
      {
        type: "mcq",
        prompt: "Which letter is this? उ",
        options: ["u", "uu", "o", "a"],
        correctAnswer: "u",
        explanation: "उ (u) sounds like 'u' in 'put'. Short and rounded.",
        order: 5,
      },
      {
        type: "mcq",
        prompt: "Which letter is this? ऊ",
        options: ["u", "uu", "o", "au"],
        correctAnswer: "uu",
        explanation: "ऊ (ū) is the long form of उ. Like 'oo' in 'moon'.",
        order: 6,
      },
      {
        type: "fill_blank",
        prompt: "अ is transliterated as ___",
        options: null,
        correctAnswer: "a",
        explanation: "अ is always written as 'a' in standard IAST transliteration.",
        order: 7,
      },
      {
        type: "fill_blank",
        prompt: "The long form of इ is ___",
        options: null,
        correctAnswer: "ई",
        explanation: "Every short vowel in Sanskrit has a long counterpart held for two units (mātrā).",
        order: 8,
      },
    ],
  },

  {
    slug: "devanagari-consonants-1",
    title: "Consonants: Ka to Na",
    category: "alphabet",
    difficulty: "beginner",
    xpReward: 50,
    order: 2,
    questions: [
      {
        type: "mcq",
        prompt: "Which consonant is this? क",
        options: ["ka", "ga", "kha", "ta"],
        correctAnswer: "ka",
        explanation: "क (ka) is the first consonant in Sanskrit, from the velar group. Like 'k' in 'sky'.",
        order: 1,
      },
      {
        type: "mcq",
        prompt: "Which consonant is this? ग",
        options: ["ka", "ga", "gha", "kha"],
        correctAnswer: "ga",
        explanation: "ग (ga) is the voiced counterpart of क. Like 'g' in 'go'.",
        order: 2,
      },
      {
        type: "mcq",
        prompt: "Which consonant is this? च",
        options: ["ca", "cha", "ja", "ta"],
        correctAnswer: "ca",
        explanation: "च (ca) sounds like 'ch' in 'church'. It begins the palatal consonant group.",
        order: 3,
      },
      {
        type: "mcq",
        prompt: "Which consonant is this? त",
        options: ["ta", "tha", "da", "na"],
        correctAnswer: "ta",
        explanation: "त (ta) is a dental 't' — the tongue touches the teeth, not the palate. Very different from English 't'.",
        order: 4,
      },
      {
        type: "mcq",
        prompt: "Which consonant is this? न",
        options: ["na", "ma", "pa", "la"],
        correctAnswer: "na",
        explanation: "न (na) is the dental nasal, like 'n' in 'not'.",
        order: 5,
      },
      {
        type: "transliterate",
        prompt: "Write the Devanagari letter for 'ka'",
        options: null,
        correctAnswer: "क",
        explanation: "क is the first consonant of Sanskrit and sits at the top of the velar row in the traditional ordering.",
        order: 6,
      },
      {
        type: "transliterate",
        prompt: "Write the Devanagari letter for 'ga'",
        options: null,
        correctAnswer: "ग",
        explanation: "ग is the third letter of the velar row (ka, kha, ga, gha, ṅa).",
        order: 7,
      },
    ],
  },

  // ── CATEGORY: transliteration ────────────────────────────────────────────────
  {
    slug: "iast-basics",
    title: "IAST Transliteration Basics",
    category: "transliteration",
    difficulty: "beginner",
    xpReward: 45,
    order: 1,
    questions: [
      {
        type: "mcq",
        prompt: "In IAST, the long ā is written as:",
        options: ["aa", "ā", "a:", "â"],
        correctAnswer: "ā",
        explanation: "IAST (International Alphabet of Sanskrit Transliteration) uses macrons over vowels to indicate length. ā = आ.",
        order: 1,
      },
      {
        type: "mcq",
        prompt: "What does the dot below a letter mean in IAST? e.g. ṭ",
        options: ["It is aspirated", "It is retroflex", "It is nasal", "It is long"],
        correctAnswer: "It is retroflex",
        explanation: "A subscript dot marks retroflex consonants — sounds made with the tongue curled back to touch the roof of the mouth.",
        order: 2,
      },
      {
        type: "mcq",
        prompt: "How do you write ओम् in IAST?",
        options: ["om", "aum", "oṃ", "Om"],
        correctAnswer: "oṃ",
        explanation: "ओम् is written as 'oṃ' in IAST. The ṃ represents anusvāra — a nasal resonance.",
        order: 3,
      },
      {
        type: "fill_blank",
        prompt: "The IAST letter ś represents the sound in ___",
        options: null,
        correctAnswer: "श",
        explanation: "ś (श) is a palatal sibilant — like 'sh' in 'sheep' but slightly softer. Not the same as ṣ (ष).",
        order: 4,
      },
      {
        type: "mcq",
        prompt: "Which Devanagari letter does 'ñ' represent in IAST?",
        options: ["न", "ण", "ञ", "ङ"],
        correctAnswer: "ञ",
        explanation: "ñ (ञ) is the palatal nasal, appearing in words like jñāna (ज्ञान — knowledge).",
        order: 5,
      },
      {
        type: "transliterate",
        prompt: "Transliterate: नम (using IAST)",
        options: null,
        correctAnswer: "nama",
        explanation: "न = na, म = ma. Together: nama. As in 'namaste' (नमस्ते).",
        order: 6,
      },
    ],
  },

  // ── CATEGORY: vocabulary ─────────────────────────────────────────────────────
  {
    slug: "core-nouns-1",
    title: "Core Sanskrit Nouns",
    category: "vocabulary",
    difficulty: "beginner",
    xpReward: 55,
    order: 1,
    questions: [
      {
        type: "mcq",
        prompt: "What does 'ज्ञान' (jñāna) mean?",
        options: ["Water", "Knowledge", "Fire", "Sky"],
        correctAnswer: "Knowledge",
        explanation: "jñāna is one of the most important words in Sanskrit philosophy. It means knowledge or wisdom, especially self-knowledge.",
        order: 1,
      },
      {
        type: "mcq",
        prompt: "What does 'आत्मन्' (ātman) mean?",
        options: ["Mind", "Soul / Self", "Body", "World"],
        correctAnswer: "Soul / Self",
        explanation: "Ātman refers to the individual self or soul. In Vedanta, it is ultimately identical to Brahman (the universal consciousness).",
        order: 2,
      },
      {
        type: "mcq",
        prompt: "What does 'अग्नि' (agni) mean?",
        options: ["Water", "Earth", "Fire", "Wind"],
        correctAnswer: "Fire",
        explanation: "Agni is fire — both the physical element and the Vedic deity. Related to the English word 'ignite'.",
        order: 3,
      },
      {
        type: "mcq",
        prompt: "What does 'वायु' (vāyu) mean?",
        options: ["Fire", "Wind / Air", "Water", "Space"],
        correctAnswer: "Wind / Air",
        explanation: "Vāyu is wind or air, one of the five classical elements (pañcabhūta). Vāyu is also a Vedic deity.",
        order: 4,
      },
      {
        type: "mcq",
        prompt: "What does 'सत्य' (satya) mean?",
        options: ["Beauty", "Power", "Truth", "Peace"],
        correctAnswer: "Truth",
        explanation: "Satya means truth or reality. It is one of the yamas in Patañjali's Yoga Sūtras.",
        order: 5,
      },
      {
        type: "fill_blank",
        prompt: "अहम् (aham) means ___ in English",
        options: null,
        correctAnswer: "I",
        explanation: "Aham means 'I' — the first-person singular pronoun. Related to 'ego' via Proto-Indo-European roots.",
        order: 6,
      },
      {
        type: "fill_blank",
        prompt: "The Sanskrit word for 'peace' is शान्ति, transliterated as ___",
        options: null,
        correctAnswer: "śānti",
        explanation: "Śānti (शान्ति) means peace or tranquility. Famously repeated three times — śāntiḥ śāntiḥ śāntiḥ — at the end of Upanishadic prayers.",
        order: 7,
      },
      {
        type: "mcq",
        prompt: "What does 'देव' (deva) mean?",
        options: ["Demon", "Divine being / God", "Human", "Animal"],
        correctAnswer: "Divine being / God",
        explanation: "Deva means a shining one or divine being. Cognate with Latin 'deus' and English 'divine'.",
        order: 8,
      },
    ],
  },

  {
    slug: "numbers-1-10",
    title: "Numbers 1 to 10",
    category: "vocabulary",
    difficulty: "beginner",
    xpReward: 40,
    order: 2,
    questions: [
      {
        type: "mcq",
        prompt: "What number is 'एक' (eka)?",
        options: ["1", "2", "3", "5"],
        correctAnswer: "1",
        explanation: "Eka (एक) means one. Cognate with Latin 'unus' and English 'once'.",
        order: 1,
      },
      {
        type: "mcq",
        prompt: "What number is 'द्वि' (dvi)?",
        options: ["1", "2", "3", "4"],
        correctAnswer: "2",
        explanation: "Dvi (द्वि) means two. Cognate with English 'two', Latin 'duo', Greek 'duo'.",
        order: 2,
      },
      {
        type: "mcq",
        prompt: "What number is 'त्रि' (tri)?",
        options: ["2", "3", "4", "6"],
        correctAnswer: "3",
        explanation: "Tri (त्रि) means three. Same root as English 'three', Latin 'tres'.",
        order: 3,
      },
      {
        type: "mcq",
        prompt: "What number is 'पञ्च' (pañca)?",
        options: ["4", "5", "6", "7"],
        correctAnswer: "5",
        explanation: "Pañca (पञ्च) means five. Cognate with Greek 'pente', Persian 'panj', English 'five'.",
        order: 4,
      },
      {
        type: "mcq",
        prompt: "What number is 'दश' (daśa)?",
        options: ["8", "9", "10", "11"],
        correctAnswer: "10",
        explanation: "Daśa (दश) means ten. Cognate with Latin 'decem', Greek 'deka', English 'decade'.",
        order: 5,
      },
      {
        type: "fill_blank",
        prompt: "The Sanskrit word for seven is सप्त, transliterated as ___",
        options: null,
        correctAnswer: "sapta",
        explanation: "Sapta (सप्त) means seven. Cognate with Latin 'septem', English 'seven'.",
        order: 6,
      },
    ],
  },

  // ── CATEGORY: grammar ────────────────────────────────────────────────────────
  {
    slug: "noun-cases-intro",
    title: "Introduction to Noun Cases (Vibhakti)",
    category: "grammar",
    difficulty: "intermediate",
    xpReward: 70,
    order: 1,
    questions: [
      {
        type: "mcq",
        prompt: "How many cases (vibhakti) does Sanskrit have?",
        options: ["4", "6", "8", "10"],
        correctAnswer: "8",
        explanation: "Sanskrit has 8 cases: nominative, accusative, instrumental, dative, ablative, genitive, locative, and vocative.",
        order: 1,
      },
      {
        type: "mcq",
        prompt: "The nominative case (prathamā vibhakti) marks the ___",
        options: ["object of an action", "subject of a sentence", "indirect object", "place of action"],
        correctAnswer: "subject of a sentence",
        explanation: "Prathamā (first case) is the nominative — it marks who is doing the action.",
        order: 2,
      },
      {
        type: "mcq",
        prompt: "The accusative case (dvitīyā vibhakti) marks the ___",
        options: ["subject", "direct object", "possession", "location"],
        correctAnswer: "direct object",
        explanation: "Dvitīyā (second case) marks the direct object — what the action is done to.",
        order: 3,
      },
      {
        type: "fill_blank",
        prompt: "The genitive case expresses ___ (what relationship?)",
        options: null,
        correctAnswer: "possession",
        explanation: "The genitive (ṣaṣṭhī vibhakti) expresses possession or relation — equivalent to 'of' or 's in English.",
        order: 4,
      },
      {
        type: "mcq",
        prompt: "In 'rāmasya grāmaḥ' (the village of Rama), 'rāmasya' is in which case?",
        options: ["Nominative", "Accusative", "Genitive", "Locative"],
        correctAnswer: "Genitive",
        explanation: "The ending '-sya' marks genitive singular in the a-stem masculine declension.",
        order: 5,
      },
    ],
  },

  // ── CATEGORY: shlokas ────────────────────────────────────────────────────────
  {
    slug: "gayatri-mantra",
    title: "The Gāyatrī Mantra",
    category: "shlokas",
    difficulty: "intermediate",
    xpReward: 80,
    order: 1,
    questions: [
      {
        type: "mcq",
        prompt: "The Gāyatrī Mantra comes from which Veda?",
        options: ["Rig Veda", "Sama Veda", "Yajur Veda", "Atharva Veda"],
        correctAnswer: "Rig Veda",
        explanation: "The Gāyatrī Mantra (RV 3.62.10) is from the Rig Veda, the oldest of the four Vedas.",
        order: 1,
      },
      {
        type: "mcq",
        prompt: "What does 'bhargo' mean in the Gāyatrī Mantra?",
        options: ["Sky", "Radiance / Lustre", "Earth", "Waters"],
        correctAnswer: "Radiance / Lustre",
        explanation: "Bhargo (भर्गो) means divine radiance or splendour. It refers to the illuminating light of the divine.",
        order: 2,
      },
      {
        type: "mcq",
        prompt: "The Gāyatrī Mantra is a prayer for ___",
        options: ["Wealth", "Long life", "Illumination of the intellect", "Victory in battle"],
        correctAnswer: "Illumination of the intellect",
        explanation: "The mantra asks the divine light (of Savitṛ, the sun) to illuminate and guide the intellect (dhiyaḥ).",
        order: 3,
      },
      {
        type: "fill_blank",
        prompt: "तत् सवितुर् वरेण्यम् — 'savituḥ' refers to ___",
        options: null,
        correctAnswer: "the sun",
        explanation: "Savitṛ (सवितृ) is the solar deity — the vivifying aspect of the sun. 'Savituḥ' is its genitive form.",
        order: 4,
      },
      {
        type: "transliterate",
        prompt: "Write the IAST transliteration of: ॐ",
        options: null,
        correctAnswer: "oṃ",
        explanation: "OM (ॐ) is the primordial sound. In IAST it is written 'oṃ' — the ṃ representing the nasal resonance (anusvāra).",
        order: 5,
      },
    ],
  },
]

// ── Main seed function ────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding database…")

  // Delete in dependency order
  await prisma.achievement.deleteMany()
  await prisma.userProgress.deleteMany()
  await prisma.friendship.deleteMany()
  await prisma.battle.deleteMany()
  await prisma.question.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.user.deleteMany()

  // Seed lessons and questions — all free
  for (const lesson of LESSONS) {
    const { questions, ...lessonData } = lesson
    const created = await prisma.lesson.create({ data: lessonData })
    console.log(`  [lesson] ${created.title}`)

    for (const q of questions) {
      await prisma.question.create({
        data: {
          lessonId: created.id,
          type: q.type,
          prompt: q.prompt,
          options: q.options ?? undefined,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          order: q.order,
        },
      })
    }
  }

  const totalQ = LESSONS.reduce((n, l) => n + l.questions.length, 0)
  console.log(`\nSeeded ${LESSONS.length} lessons, ${totalQ} questions.`)

  // ── Admin user — credentials from environment variables ───────────────────────
  // Set ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD in .env before seeding.
  // The admin account is NEVER created from user-facing registration.
  const adminEmail    = process.env.ADMIN_EMAIL
  const adminUsername = process.env.ADMIN_USERNAME
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminUsername || !adminPassword) {
    console.warn(
      "\nWarning: ADMIN_EMAIL, ADMIN_USERNAME, or ADMIN_PASSWORD not set — skipping admin user.",
    )
  } else {
    // Require a strong admin password: ≥12 chars, upper, lower, digit, special char.
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,}$/
    if (!strongPassword.test(adminPassword)) {
      console.error(
        "\nError: ADMIN_PASSWORD does not meet strength requirements.\n" +
        "  Required: at least 12 characters, one uppercase, one lowercase, one digit, one special character.\n" +
        "  Example: openssl rand -base64 18\n" +
        "Aborting seed to protect the admin account."
      )
      process.exit(1)
    }
    const adminHash = await argon2.hash(adminPassword, { type: argon2.argon2id })
    await prisma.user.upsert({
      where:  { email: adminEmail },
      update: { username: adminUsername, passwordHash: adminHash, role: "ADMIN" },
      create: {
        email:        adminEmail,
        username:     adminUsername,
        passwordHash: adminHash,
        role:         "ADMIN",
      },
    })
    console.log(`\nAdmin user seeded: ${adminUsername} <${adminEmail}>`)
  }

  // ── Dev test user ─────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const hash = await argon2.hash("TestUser1!", { type: argon2.argon2id })
    await prisma.user.upsert({
      where:  { email: "test@test.fsts.dev" },
      update: {},
      create: {
        username:     "test_user",
        email:        "test@test.fsts.dev",
        passwordHash: hash,
        role:         "USER",
      },
    })
    console.log("Test account: test_user / TestUser1!")
  }

  console.log("\nDone.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
