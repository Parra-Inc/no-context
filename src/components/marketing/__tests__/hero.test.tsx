/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { render, screen } from "@testing-library/react";
import { Hero } from "../hero";

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} />
  ),
}));

// Mock next/link
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Landing Page → Add to Slack", () => {
  it("renders the Add to Slack CTA that links to /api/slack/install", () => {
    render(<Hero />);

    const addToSlackLink = screen.getByRole("link", {
      name: /add to slack/i,
    });
    expect(addToSlackLink).toBeInTheDocument();
    expect(addToSlackLink).toHaveAttribute("href", "/api/slack/install");
  });

  it("renders the How it Works secondary CTA", () => {
    render(<Hero />);

    const howItWorksLink = screen.getByRole("link", {
      name: /how it works/i,
    });
    expect(howItWorksLink).toBeInTheDocument();
    expect(howItWorksLink).toHaveAttribute("href", "#how-it-works");
  });

  it("renders the hero headline and description", () => {
    render(<Hero />);

    expect(
      screen.getByRole("heading", { level: 1, name: /art/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/drop a quote in slack/i)).toBeInTheDocument();
  });
});
