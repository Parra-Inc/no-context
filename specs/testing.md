# No Context - Testing Spec

## Overview

All tests use **Jest** as the test runner and assertion library. React components are tested with **React Testing Library**. API routes and backend logic use Jest directly with mocked dependencies.

---

## Tech Stack

| Tool                                                 | Purpose                                         |
| ---------------------------------------------------- | ----------------------------------------------- |
| **Jest**                                             | Test runner, assertions, mocking                |
| **React Testing Library** (`@testing-library/react`) | Component rendering and interaction             |
| **`@testing-library/jest-dom`**                      | Custom DOM matchers (`toBeInTheDocument`, etc.) |
| **`@testing-library/user-event`**                    | Simulating realistic user interactions          |
| **`next/jest`**                                      | Next.js Jest configuration preset               |
| **`node-mocks-http`**                                | Mock `Request`/`Response` for API route tests   |
| **`jest-mock-extended`**                             | Strongly-typed Prisma client mocks              |

---

## Project Structure

```
no-context/
├── jest.config.ts                # Root Jest config using next/jest
├── jest.setup.ts                 # Global setup (jest-dom, mocks)
├── src/
│   ├── __mocks__/                # Manual mocks for shared modules
│   │   ├── prisma.ts             # Mock Prisma client
│   │   ├── stripe.ts             # Mock Stripe client
│   │   ├── slack.ts              # Mock Slack WebClient
│   │   └── storage.ts            # Mock R2/S3 upload
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── quote-detector.ts
│   │   │   ├── quote-detector.test.ts
│   │   │   ├── image-generator.ts
│   │   │   └── image-generator.test.ts
│   │   ├── encryption.ts
│   │   ├── encryption.test.ts
│   │   ├── styles.ts
│   │   └── styles.test.ts
│   ├── app/
│   │   ├── api/
│   │   │   ├── slack/
│   │   │   │   ├── events/__tests__/route.test.ts
│   │   │   │   ├── commands/__tests__/route.test.ts
│   │   │   │   └── callback/__tests__/route.test.ts
│   │   │   ├── stripe/
│   │   │   │   └── webhook/__tests__/route.test.ts
│   │   │   └── quotes/
│   │   │       └── __tests__/route.test.ts
│   │   ├── (marketing)/
│   │   │   └── __tests__/page.test.tsx
│   │   └── (dashboard)/
│   │       └── dashboard/
│   │           ├── __tests__/page.test.tsx
│   │           ├── gallery/__tests__/page.test.tsx
│   │           └── settings/__tests__/page.test.tsx
│   └── components/
│       ├── marketing/__tests__/
│       ├── dashboard/__tests__/
│       └── ui/__tests__/
```

Test files live **co-located** next to their source files (or in `__tests__/` subdirectories for route handlers).

---

## Configuration

### `jest.config.ts`

```ts
import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterSetup: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/types/**",
    "!src/components/ui/**", // shadcn components — third-party
    "!src/app/**/layout.tsx",
  ],
};

export default createJestConfig(config);
```

### `jest.setup.ts`

```ts
import "@testing-library/jest-dom";

// Global mocks
jest.mock("@/lib/prisma");
jest.mock("@/lib/stripe");
jest.mock("@/lib/slack");
```

---

## Mocking Strategy

### Prisma

Use `jest-mock-extended` to create a typed mock of the Prisma client.

```ts
// src/__mocks__/prisma.ts
import { PrismaClient } from "@prisma/client";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";

const prismaMock = mockDeep<PrismaClient>();
export default prismaMock;
export type MockPrismaClient = DeepMockProxy<PrismaClient>;
```

### Slack WebClient

```ts
// src/__mocks__/slack.ts
export const mockSlackClient = {
  chat: { postMessage: jest.fn() },
  reactions: { add: jest.fn(), remove: jest.fn() },
  files: { uploadV2: jest.fn() },
  conversations: { info: jest.fn() },
  users: { info: jest.fn() },
  team: { info: jest.fn() },
};

export const getSlackClient = jest.fn(() => mockSlackClient);
```

### Stripe

```ts
// src/__mocks__/stripe.ts
export const mockStripe = {
  checkout: { sessions: { create: jest.fn() } },
  billingPortal: { sessions: { create: jest.fn() } },
  webhooks: { constructEvent: jest.fn() },
  customers: { create: jest.fn() },
  subscriptions: { retrieve: jest.fn(), update: jest.fn() },
};

export default jest.fn(() => mockStripe);
```

### External AI APIs

```ts
// Mock Anthropic (Claude) — mock at the module level per test
jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(),
    },
  })),
}));

// Mock OpenAI (DALL-E)
jest.mock("openai", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    images: {
      generate: jest.fn(),
    },
  })),
}));
```

### Environment Variables

```ts
// In individual test files or jest.setup.ts
process.env.TOKEN_ENCRYPTION_KEY = "0".repeat(64); // 32-byte hex
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.SLACK_SIGNING_SECRET = "test-signing-secret";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
```

---

## Test Categories

### 1. Unit Tests — Library / Business Logic

These are fast, isolated tests with all external dependencies mocked.

#### Quote Detector (`src/lib/ai/quote-detector.test.ts`)

```ts
describe("detectQuote", () => {
  it("classifies a valid out-of-context quote", async () => { ... });
  it("rejects a regular conversation message", async () => { ... });
  it("rejects messages under 3 words", async () => { ... });
  it("rejects messages over 280 characters", async () => { ... });
  it("rejects emoji-only messages", async () => { ... });
  it("skips when confidence is below 0.7", async () => { ... });
  it("extracts quote text and attribution", async () => { ... });
  it("handles Claude API errors gracefully", async () => { ... });
});
```

#### Image Generator (`src/lib/ai/image-generator.test.ts`)

```ts
describe("generateImage", () => {
  it("constructs the correct DALL-E prompt from quote and style", async () => { ... });
  it("returns the image URL on success", async () => { ... });
  it("retries with softened prompt on content policy rejection", async () => { ... });
  it("returns null after two content policy rejections", async () => { ... });
  it("throws on unexpected API errors", async () => { ... });
});
```

#### Encryption (`src/lib/encryption.test.ts`)

```ts
describe("encryption", () => {
  it("encrypts and decrypts a Slack bot token", () => { ... });
  it("produces different ciphertext for same plaintext (unique IVs)", () => { ... });
  it("throws on invalid ciphertext", () => { ... });
  it("throws when encryption key is missing", () => { ... });
});
```

#### Art Styles (`src/lib/styles.test.ts`)

```ts
describe("art styles", () => {
  it("exports all 15 built-in styles", () => { ... });
  it("each style has id, displayName, and promptModifier", () => { ... });
  it("getStyleById returns the correct style", () => { ... });
  it("getStyleById returns null for unknown id", () => { ... });
});
```

---

### 2. API Route Tests

Test Next.js route handlers by importing the handler function and passing mock `Request` objects.

#### Slack Events (`src/app/api/slack/events/__tests__/route.test.ts`)

```ts
describe("POST /api/slack/events", () => {
  it("responds to Slack url_verification challenge", async () => { ... });
  it("returns 200 immediately for valid message events", async () => { ... });
  it("rejects requests with invalid Slack signature", async () => { ... });
  it("ignores bot messages", async () => { ... });
  it("ignores thread replies", async () => { ... });
  it("ignores message edits (message_changed subtype)", async () => { ... });
  it("skips when workspace is inactive", async () => { ... });
  it("skips when channel is not connected", async () => { ... });
  it("skips when channel is paused", async () => { ... });
  it("reacts with limit emoji when quota exceeded", async () => { ... });
  it("enqueues image generation job for valid quote", async () => { ... });
  it("does nothing for messages classified as not-a-quote", async () => { ... });
});
```

#### Slack OAuth Callback (`src/app/api/slack/callback/__tests__/route.test.ts`)

```ts
describe("GET /api/slack/callback", () => {
  it("exchanges auth code for bot token and stores workspace", async () => { ... });
  it("encrypts the bot token before storing", async () => { ... });
  it("redirects to onboarding on success", async () => { ... });
  it("handles duplicate workspace install (updates token)", async () => { ... });
  it("returns error for invalid auth code", async () => { ... });
});
```

#### Stripe Webhook (`src/app/api/stripe/webhook/__tests__/route.test.ts`)

```ts
describe("POST /api/stripe/webhook", () => {
  it("verifies webhook signature", async () => { ... });
  it("rejects invalid signatures", async () => { ... });
  it("handles checkout.session.completed — activates subscription", async () => { ... });
  it("handles customer.subscription.updated — updates tier and quota", async () => { ... });
  it("handles customer.subscription.deleted — downgrades to FREE", async () => { ... });
  it("handles invoice.payment_failed — sets PAST_DUE status", async () => { ... });
  it("ignores unhandled event types", async () => { ... });
});
```

#### Quotes API (`src/app/api/quotes/__tests__/route.test.ts`)

```ts
describe("GET /api/quotes", () => {
  it("returns paginated quotes for authenticated workspace", async () => { ... });
  it("returns 401 for unauthenticated requests", async () => { ... });
  it("filters by channel", async () => { ... });
  it("filters by style", async () => { ... });
  it("searches by quote text", async () => { ... });
  it("sorts by newest first (default)", async () => { ... });
  it("sorts by favorites", async () => { ... });
});
```

---

### 3. Component Tests

Test React components render correctly and respond to user interaction. Mock API calls and router navigation.

#### Marketing Page (`src/app/(marketing)/__tests__/page.test.tsx`)

```ts
describe("Marketing Landing Page", () => {
  it("renders the hero headline", () => { ... });
  it("renders the Add to Slack CTA button", () => { ... });
  it("renders all four pricing tiers", () => { ... });
  it("toggles between monthly and annual pricing", async () => { ... });
  it("renders all FAQ items", () => { ... });
  it("expands FAQ accordion on click", async () => { ... });
  it("renders all 15 art style options in the showcase", () => { ... });
});
```

#### Dashboard Home (`src/app/(dashboard)/dashboard/__tests__/page.test.tsx`)

```ts
describe("Dashboard Home", () => {
  it("displays workspace name and icon", () => { ... });
  it("displays usage progress bar with correct percentage", () => { ... });
  it("displays stats cards (this month, channels, all time)", () => { ... });
  it("renders recent quotes grid", () => { ... });
  it("renders connected channels list", () => { ... });
  it("shows upgrade prompt when on free tier", () => { ... });
});
```

#### Gallery (`src/app/(dashboard)/dashboard/gallery/__tests__/page.test.tsx`)

```ts
describe("Gallery Page", () => {
  it("renders quote cards in a grid", () => { ... });
  it("loads more quotes on scroll / button click", async () => { ... });
  it("filters by channel", async () => { ... });
  it("filters by style", async () => { ... });
  it("searches by quote text", async () => { ... });
  it("toggles favorite on heart icon click", async () => { ... });
  it("opens quote detail modal on card click", async () => { ... });
});
```

---

### 4. Integration-Style Tests (Larger Units)

These tests exercise multiple modules together but still mock external APIs (Slack, Claude, DALL-E, Stripe, database).

#### Full Message Flow

```ts
describe("Message processing pipeline", () => {
  it("valid quote → detection → enqueue → generation → slack reply → db save", async () => {
    // 1. Simulate Slack event with a valid quote message
    // 2. Assert Claude was called with correct prompt
    // 3. Assert job was enqueued
    // 4. Simulate worker processing the job
    // 5. Assert DALL-E was called with correct prompt + style
    // 6. Assert image uploaded to R2
    // 7. Assert Slack thread reply posted with image
    // 8. Assert database record created with status COMPLETED
    // 9. Assert usage count incremented
  });

  it("quota exceeded → react with limit emoji → no generation", async () => { ... });
  it("not a quote → silent skip → no side effects", async () => { ... });
  it("image generation fails → text fallback reply → status FAILED", async () => { ... });
});
```

#### OAuth Install Flow

```ts
describe("OAuth install flow", () => {
  it("install → store workspace → create free subscription → redirect to onboarding", async () => { ... });
  it("reinstall → update token → keep existing subscription", async () => { ... });
});
```

---

## npm Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

---

## Coverage Targets

| Area                    | Target   |
| ----------------------- | -------- |
| `src/lib/ai/`           | 90%+     |
| `src/lib/encryption.ts` | 100%     |
| `src/lib/styles.ts`     | 100%     |
| `src/app/api/slack/`    | 85%+     |
| `src/app/api/stripe/`   | 85%+     |
| `src/app/api/quotes/`   | 80%+     |
| Components (marketing)  | 70%+     |
| Components (dashboard)  | 75%+     |
| **Overall**             | **80%+** |

---

## CI Integration

Tests run on every push and PR via GitHub Actions:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx prisma generate
      - run: npm run test:ci
```

---

## Key Testing Principles

1. **Mock at the boundary** — Mock Prisma, Slack SDK, Stripe, Claude, DALL-E. Test your logic, not theirs.
2. **Co-locate tests** — Test files live next to source files for easy discovery.
3. **Test behavior, not implementation** — Assert on outputs and side effects, not internal function calls.
4. **No real API calls** — All external services are mocked. Tests must run offline and fast.
5. **Deterministic** — No reliance on time, randomness, or ordering. Use `jest.useFakeTimers()` where needed.
6. **Fast** — The full suite should run in under 30 seconds.
