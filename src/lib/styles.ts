export interface ArtStyle {
  id: string;
  displayName: string;
  promptModifier: string;
}

export const ART_STYLES: ArtStyle[] = [
  {
    id: "watercolor",
    displayName: "Watercolor",
    promptModifier:
      "soft watercolor painting with gentle washes of color, loose brushstrokes, and white paper showing through",
  },
  {
    id: "picasso",
    displayName: "Picasso / Cubism",
    promptModifier:
      "cubist painting in the style of Pablo Picasso, with geometric shapes, multiple perspectives, and bold outlines",
  },
  {
    id: "vangogh",
    displayName: "Van Gogh / Post-Impressionist",
    promptModifier:
      "painting in the style of Vincent van Gogh, with swirling brushstrokes, vivid colors, and emotional intensity",
  },
  {
    id: "monet",
    displayName: "Monet / Impressionist",
    promptModifier:
      "impressionist painting in the style of Claude Monet, with soft light, dappled colors, and atmospheric effects",
  },
  {
    id: "warhol",
    displayName: "Warhol / Pop Art",
    promptModifier:
      "pop art print in the style of Andy Warhol, with bright flat colors, bold outlines, and repeated motifs",
  },
  {
    id: "hokusai",
    displayName: "Hokusai / Ukiyo-e",
    promptModifier:
      "Japanese woodblock print in the style of Hokusai, with flowing lines, flat color areas, and dynamic composition",
  },
  {
    id: "dali",
    displayName: "Dali / Surrealism",
    promptModifier:
      "surrealist painting in the style of Salvador Dali, with melting forms, dreamlike landscapes, and impossible physics",
  },
  {
    id: "mondrian",
    displayName: "Mondrian / De Stijl",
    promptModifier:
      "abstract geometric composition in the style of Piet Mondrian, with primary colors, black grid lines, and white space",
  },
  {
    id: "basquiat",
    displayName: "Basquiat / Neo-Expressionism",
    promptModifier:
      "raw neo-expressionist painting in the style of Jean-Michel Basquiat, with bold marks, crowns, and street art energy",
  },
  {
    id: "rockwell",
    displayName: "Rockwell / Americana",
    promptModifier:
      "Norman Rockwell-style illustration with warm Americana charm, detailed characters, and storytelling composition",
  },
  {
    id: "miyazaki",
    displayName: "Miyazaki / Studio Ghibli",
    promptModifier:
      "Studio Ghibli-style illustration with lush environments, whimsical characters, and a sense of wonder",
  },
  {
    id: "comic",
    displayName: "Comic Book",
    promptModifier:
      "vibrant comic book panel with bold ink lines, halftone dots, dynamic angles, and speech bubbles",
  },
  {
    id: "pixel",
    displayName: "Pixel Art",
    promptModifier:
      "detailed pixel art scene with a limited color palette, clean pixel placement, and retro video game aesthetic",
  },
  {
    id: "sketch",
    displayName: "Pencil Sketch",
    promptModifier:
      "detailed pencil sketch with cross-hatching, varying line weights, and expressive shading on white paper",
  },
  {
    id: "stainedglass",
    displayName: "Stained Glass",
    promptModifier:
      "stained glass window design with bold black leading lines, jewel-toned translucent colors, and radiant light",
  },
];

export function getStyleById(id: string): ArtStyle | null {
  return ART_STYLES.find((style) => style.id === id) ?? null;
}

export function getStylePrompt(
  styleId: string,
  customDescription?: string,
): string {
  if (customDescription) {
    return `Create a workplace-appropriate illustration in the following style: ${customDescription}`;
  }

  const style = getStyleById(styleId);
  if (!style) {
    // Fall back to watercolor
    return ART_STYLES[0].promptModifier;
  }

  return style.promptModifier;
}
