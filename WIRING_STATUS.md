# Wiring Status — updated this session

## Fixed this session
- Confirmed `QUESTION_BANK`, `mockTeacher`, `seedPapers` (mockData.js) and
  `seedTeacherQuestions`/`seedSchoolQuestions` (questionBankData.js) were
  already dead/unused code (Question Bank + Papers are fully backend-wired
  via questionBankApi.js / paperApi.js). Removed all of it — no leftover
  static "fake data" arrays remain anywhere in the app. Only genuine UI
  config (enum lists like EXAM_TYPES, PAPER_SIZES, marketing copy in
  plans.js) is still static, which is correct — that's not business data.
- Fixed a real bug: `QuestionBank.jsx` swallowed fetch errors
  (`.catch(() => {})`) so a failed load silently showed an empty state
  instead of an error. Fixed with proper error state + Retry button.
- Fixed a worse bug: `SchoolQuestionBank.jsx` had **no catch at all** on
  the initial fetch — if `/api/question-bank?scope=school` failed, the
  page stayed on the loading skeleton forever. Fixed the same way.
- Fixed the same missing-catch bug in `MyPapers.jsx`.
- Added `useOnlineStatus` banner ("You're offline...") to Question Bank
  and My Papers pages, matching the pattern already used in PaperBuilder
  (pending item #7 from the previous handoff).
- Verified `npm run build` passes clean after all of the above changes
  (2073 modules, no errors).

## Still outstanding (see backend WIRING_STATUS / commit notes for backend side)
- Subscription page pricing is still duplicated in `data/plans.js`
  (frontend) and `SubscriptionService.createOrder()` (backend hardcoded
  switch). Not centralized yet — see backend notes for the recommended
  fix (a `/api/plans` endpoint + `@ConfigurationProperties`).
- Payment gateway is still `MockPaymentGatewayService` on the backend —
  no real Razorpay/Stripe integration.
- No live end-to-end QA against a running backend + MySQL was possible in
  this sandbox (network egress to Maven Central is blocked here, so the
  Spring Boot backend cannot be compiled/run in this environment — same
  limitation as last session). `npm run build` on the frontend was
  verified in this sandbox; the Java side needs `mvn clean install` on
  your machine/CI before you trust it compiles.
