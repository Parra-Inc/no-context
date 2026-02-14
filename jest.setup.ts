import "@testing-library/jest-dom";

// Global mocks
jest.mock("@/lib/prisma");
jest.mock("@/lib/stripe");
jest.mock("@/lib/slack");

// Environment variables for tests
process.env.TOKEN_ENCRYPTION_KEY = "0".repeat(64);
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.SLACK_SIGNING_SECRET = "test-signing-secret";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
process.env.SLACK_CLIENT_ID = "test-client-id";
process.env.SLACK_CLIENT_SECRET = "test-client-secret";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
