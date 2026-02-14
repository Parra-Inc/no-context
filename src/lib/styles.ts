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
  {
    id: "kpop",
    displayName: "K-Pop Demon Hunters",
    promptModifier:
      "stylish K-pop idol aesthetic fused with dark fantasy demon hunting, featuring characters in sleek idol outfits with glowing weapons, neon-lit supernatural battlegrounds, dramatic poses, vibrant hair colors, and manhwa-inspired linework",
  },
  {
    id: "fortnite",
    displayName: "Fortnite",
    promptModifier:
      "Fortnite-inspired 3D cartoon style with exaggerated proportions, vibrant saturated colors, cel-shaded characters, bold outlines, playful action poses, and a colorful stylized environment",
  },
  {
    id: "archer",
    displayName: "Archer",
    promptModifier:
      "Illustration in the exact art style of the attached reference image. Create ORIGINAL characters — do NOT copy any existing characters from the reference. The style features clean uniform-weight black outlines, flat cel-shaded fills, muted sophisticated colors, mid-century modern settings, and a cinematic spy-thriller atmosphere. Zero gradients, zero texture, zero painterly effects",
  },
  {
    id: "southpark",
    displayName: "South Park",
    promptModifier:
      "Illustration in the exact art style of the attached reference image. Create ORIGINAL characters — do NOT copy any existing characters, settings, or scenes from the reference. The style features clean digital 2D vector animation with flat solid colors, no gradients, no shading, simple geometric shapes, thin black outlines, and a minimal aesthetic",
  },
  {
    id: "futurama",
    displayName: "Futurama",
    promptModifier:
      "Illustration in the exact art style of the attached reference image. Create ORIGINAL characters — do NOT copy any existing characters from the reference. The style features clean uniform-weight black outlines, Groening-style large bulging round eyes, overbites, bulbous noses, bold saturated flat fills, and retro-futuristic settings. Colorful, whimsical, flat cel-shaded animation",
  },
  {
    id: "simpsons",
    displayName: "The Simpsons",
    promptModifier:
      "Illustration in the exact art style of the attached reference image. Create ORIGINAL characters — do NOT copy any existing characters from the reference. The style features thick uniform black outlines, bright yellow skin, huge circular white eyes with dot pupils, overbites, four-fingered hands, completely flat solid color fills with zero gradients or shading, and simple pastel-colored suburban settings. Bright, warm, cheerful flat 2D cel animation",
  },
  {
    id: "fallout",
    displayName: "Fallout",
    promptModifier:
      "Illustration in the exact art style of the attached reference image. Create ORIGINAL characters — do NOT copy any existing characters from the reference. The style features retro-futuristic 1950s Americana propaganda poster aesthetic, clean retro linework, warm faded colors (mustard yellow, teal, cream, rust red), exaggerated happy expressions, atomic age imagery, and optimistic Cold War-era graphic design",
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
