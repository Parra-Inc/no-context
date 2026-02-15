import { ART_STYLES, getStyleById, getStylePrompt } from "./styles";

describe("art styles", () => {
  it("exports all 22 built-in styles", () => {
    expect(ART_STYLES).toHaveLength(22);
  });

  it("each style has id, displayName, and promptModifier", () => {
    for (const style of ART_STYLES) {
      expect(style.id).toBeTruthy();
      expect(style.displayName).toBeTruthy();
      expect(style.promptModifier).toBeTruthy();
    }
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
});
