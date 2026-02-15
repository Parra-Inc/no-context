import { render, screen } from "@testing-library/react";
import MarketingPage from "../page";

// Mock all marketing components
jest.mock("@/components/marketing/hero", () => ({
  Hero: () => <section data-testid="hero">Hero</section>,
}));
jest.mock("@/components/marketing/social-proof", () => ({
  SocialProof: () => <section data-testid="social-proof">SocialProof</section>,
}));
jest.mock("@/components/marketing/how-it-works", () => ({
  HowItWorks: () => <section data-testid="how-it-works">HowItWorks</section>,
}));
jest.mock("@/components/marketing/morale-section", () => ({
  MoraleSection: () => <section data-testid="morale">MoraleSection</section>,
}));
jest.mock("@/components/marketing/styles-showcase", () => ({
  StylesShowcase: () => <section data-testid="styles">StylesShowcase</section>,
}));
jest.mock("@/components/marketing/example-gallery", () => ({
  ExampleGallery: () => <section data-testid="gallery">ExampleGallery</section>,
}));
jest.mock("@/components/marketing/features", () => ({
  Features: () => <section data-testid="features">Features</section>,
}));
jest.mock("@/components/marketing/pricing", () => ({
  Pricing: () => <section data-testid="pricing">Pricing</section>,
}));
jest.mock("@/components/marketing/faq", () => ({
  FAQ: () => <section data-testid="faq">FAQ</section>,
}));
jest.mock("@/components/marketing/final-cta", () => ({
  FinalCTA: () => <section data-testid="final-cta">FinalCTA</section>,
}));

describe("Marketing Landing Page", () => {
  it("renders all page sections", () => {
    render(<MarketingPage />);
    expect(screen.getByTestId("hero")).toBeInTheDocument();
    expect(screen.getByTestId("social-proof")).toBeInTheDocument();
    expect(screen.getByTestId("how-it-works")).toBeInTheDocument();
    expect(screen.getByTestId("morale")).toBeInTheDocument();
    expect(screen.getByTestId("styles")).toBeInTheDocument();
    expect(screen.getByTestId("gallery")).toBeInTheDocument();
    expect(screen.getByTestId("features")).toBeInTheDocument();
    expect(screen.getByTestId("pricing")).toBeInTheDocument();
    expect(screen.getByTestId("faq")).toBeInTheDocument();
    expect(screen.getByTestId("final-cta")).toBeInTheDocument();
  });
});
