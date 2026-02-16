import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInContent } from "../sign-in-content";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} />
  ),
}));

// Mock server actions
const mockSignInWithSlack = jest.fn().mockResolvedValue(null);
const mockSignInWithEmail = jest.fn().mockResolvedValue(null);
jest.mock("../actions", () => ({
  signInWithSlack: (...args: unknown[]) => mockSignInWithSlack(...args),
  signInWithEmail: (...args: unknown[]) => mockSignInWithEmail(...args),
}));

// Mock next-auth/react
const mockNextAuthSignIn = jest.fn();
jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => mockNextAuthSignIn(...args),
}));

// Mock fetch for signup API
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Sign In via Slack", () => {
  it("renders the Slack sign-in button inside a form", () => {
    render(<SignInContent />);

    const slackButton = screen.getByRole("button", {
      name: /sign in with slack/i,
    });
    expect(slackButton).toBeInTheDocument();
    expect(slackButton.closest("form")).toBeInTheDocument();
  });

  it("shows Sign In tab by default with Slack and email options", () => {
    render(<SignInContent />);

    expect(
      screen.getByRole("button", { name: /sign in with slack/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in with email/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});

describe("Sign Up via Email", () => {
  it("switches to Sign Up tab and renders the signup form", async () => {
    const user = userEvent.setup();
    render(<SignInContent />);

    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("validates password minimum length on submit", async () => {
    const user = userEvent.setup();
    render(<SignInContent />);

    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "short");

    // Use fireEvent.submit to bypass HTML5 constraint validation
    fireEvent.submit(
      screen.getByRole("button", { name: /create account/i }).closest("form")!,
    );

    expect(
      await screen.findByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls signup API and auto-signs in on success", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        userId: "user-123",
        message: "Account created.",
      }),
    });
    mockNextAuthSignIn.mockResolvedValueOnce({ ok: true });

    render(<SignInContent />);

    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(mockFetch).toHaveBeenCalledWith("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      }),
    });

    expect(mockNextAuthSignIn).toHaveBeenCalledWith("email", {
      email: "test@example.com",
      password: "password123",
      redirect: false,
    });

    expect(mockPush).toHaveBeenCalledWith("/auth/verify-email");
  });

  it("shows error when signup API returns a conflict", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: "An account with this email already exists",
      }),
    });

    render(<SignInContent />);

    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    await user.type(screen.getByLabelText(/email/i), "existing@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText(/an account with this email already exists/i),
    ).toBeInTheDocument();
  });
});
