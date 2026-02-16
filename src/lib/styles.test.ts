import {
  ART_STYLES,
  FREE_STYLES,
  PREMIUM_STYLES,
  getStyleById,
  getStylePrompt,
  roundedStyleCount,
} from "./styles";

describe("art styles", () => {
  it("exports all 22 built-in styles", () => {
    expect(ART_STYLES).toHaveLength(22);
  });

  it("each style has id, displayName, promptModifier, and isFree", () => {
    for (const style of ART_STYLES) {
      expect(style.id).toBeTruthy();
      expect(style.displayName).toBeTruthy();
      expect(style.promptModifier).toBeTruthy();
      expect(typeof style.isFree).toBe("boolean");
    }
  });

  it("has 8 free styles and 14 premium styles", () => {
    expect(FREE_STYLES.length).toBe(8);
    expect(PREMIUM_STYLES.length).toBe(14);
    expect(FREE_STYLES.length + PREMIUM_STYLES.length).toBe(ART_STYLES.length);
  });

  it("getStyleById returns the correct style", () => {
    const style = getStyleById("watercolor");
    expect(style).not.toBeNull();
    expect(style!.displayName).toBe("Watercolor");
  });

  it("getStyleById returns null for unknown id", () => {
    expect(getStyleById("nonexistent")).toBeNull();
  });

  it("getStylePrompt returns prompt modifier for known style", () => {
    const prompt = getStylePrompt("picasso");
    expect(prompt).toContain("cubist");
  });

  it("getStylePrompt falls back to watercolor for unknown style", () => {
    const prompt = getStylePrompt("unknown");
    expect(prompt).toContain("watercolor");
  });

  it("getStylePrompt uses custom description when provided", () => {
    const prompt = getStylePrompt("watercolor", "90s cereal box style");
    expect(prompt).toContain("90s cereal box style");
    expect(prompt).toContain("workplace-appropriate");
  });

  it("roundedStyleCount rounds down to nearest 5", () => {
    expect(roundedStyleCount(22)).toBe(20);
    expect(roundedStyleCount(8)).toBe(5);
    expect(roundedStyleCount(14)).toBe(10);
    expect(roundedStyleCount(25)).toBe(25);
    expect(roundedStyleCount(3)).toBe(0);
  });
});
