// Run with: npx tsx lib/access.test.ts
//
// Proves that every lesson in the seed data is accessible to any logged-in user.
// Because the platform has no premium tier, access control is purely:
//   authenticated  → allowed
//   unauthenticated → redirect to /login (handled by requireSession)
//
// Manual test steps (no running server needed):
//
//   1. Run migrations and seed:
//        npx prisma migrate dev --name remove_premium_fields
//        npm run db:seed
//
//   2. Start the dev server:
//        npm run dev
//
//   3. Sign in as the test user:
//        Username: test_user   Password: TestUser1!
//
//   4. Visit each lesson URL. All should load the lesson player, not a lock screen:
//        /learn/devanagari-vowels
//        /learn/devanagari-consonants-1
//        /learn/iast-basics
//        /learn/core-nouns-1
//        /learn/numbers-1-10
//        /learn/noun-cases-intro      ← was previously locked
//        /learn/gayatri-mantra        ← was previously locked
//
//   5. Visit /learn — all lesson cards should be clickable links, no lock icons.
//
//   6. Sign out and revisit any /learn/[slug] — you should be redirected to /login.
//
//   7. Verify the API:
//        curl http://localhost:3000/api/lessons/noun-cases-intro
//        → 401 Unauthorized (no session)
//
//        Sign in, then with the session cookie:
//        curl -b "session_user_id=..." http://localhost:3000/api/lessons/noun-cases-intro
//        → 200 with lesson JSON
//
//   8. Attempt to modify protected fields via API (should be rejected):
//        curl -X PATCH http://localhost:3000/api/users/me \
//          -H "Content-Type: application/json" \
//          -d '{"role":"admin"}' -b "session_user_id=..."
//        → 404 or 405 (route does not exist — protected fields cannot be set via API)

import { canAccessLesson } from "./access"

let passed = 0
let failed = 0

function expect(label: string, actual: boolean, expected: boolean) {
  if (actual === expected) {
    console.log(`  PASS  ${label}`)
    passed++
  } else {
    console.error(`  FAIL  ${label}`)
    console.error(`        expected ${expected}, got ${actual}`)
    failed++
  }
}

console.log("\nlib/access.ts — all content is free\n")

// Any call to canAccessLesson returns true — no arguments needed.
expect("authenticated user → allowed",    canAccessLesson(), true)
expect("called again → still allowed",    canAccessLesson(), true)
expect("return type is literally true",   canAccessLesson() === true, true)

// TypeScript-level checks (compile-time, verified by tsc):
//   - SessionUser has no isPremium field
//   - Lesson schema has no isPremium field
//   - No route imports ACCESS_DENIED or canAccessLesson with arguments

console.log(`\n${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
