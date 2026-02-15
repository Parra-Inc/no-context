import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL || "postgresql://localhost:5432/nocontext",
});
const prisma = new PrismaClient({ adapter });

const BUILT_IN_STYLES = [
  {
    name: "watercolor",
    displayName: "Watercolor",
    description:
      "soft watercolor painting with gentle washes of color, loose brushstrokes, and white paper showing through",
  },
  {
    name: "picasso",
    displayName: "Picasso / Cubism",
    description:
      "cubist painting in the style of Pablo Picasso, with geometric shapes, multiple perspectives, and bold outlines",
  },
  {
    name: "vangogh",
    displayName: "Van Gogh / Post-Impressionist",
    description:
      "painting in the style of Vincent van Gogh, with swirling brushstrokes, vivid colors, and emotional intensity",
  },
  {
    name: "monet",
    displayName: "Monet / Impressionist",
    description:
      "impressionist painting in the style of Claude Monet, with soft light, dappled colors, and atmospheric effects",
  },
  {
    name: "warhol",
    displayName: "Warhol / Pop Art",
    description:
      "pop art print in the style of Andy Warhol, with bright flat colors, bold outlines, and repeated motifs",
  },
  {
    name: "hokusai",
    displayName: "Hokusai / Ukiyo-e",
    description:
      "Japanese woodblock print in the style of Hokusai, with flowing lines, flat color areas, and dynamic composition",
  },
  {
    name: "dali",
    displayName: "Dali / Surrealism",
    description:
      "surrealist painting in the style of Salvador Dali, with melting forms, dreamlike landscapes, and impossible physics",
  },
  {
    name: "mondrian",
    displayName: "Mondrian / De Stijl",
    description:
      "abstract geometric composition in the style of Piet Mondrian, with primary colors, black grid lines, and white space",
  },
  {
    name: "basquiat",
    displayName: "Basquiat / Neo-Expressionism",
    description:
      "raw neo-expressionist painting in the style of Jean-Michel Basquiat, with bold marks, crowns, and street art energy",
  },
  {
    name: "rockwell",
    displayName: "Rockwell / Americana",
    description:
      "Norman Rockwell-style illustration with warm Americana charm, detailed characters, and storytelling composition",
  },
  {
    name: "miyazaki",
    displayName: "Miyazaki / Studio Ghibli",
    description:
      "Studio Ghibli-style illustration with lush environments, whimsical characters, and a sense of wonder",
  },
  {
    name: "comic",
    displayName: "Comic Book",
    description:
      "vibrant comic book panel with bold ink lines, halftone dots, dynamic angles, and speech bubbles",
  },
  {
    name: "pixel",
    displayName: "Pixel Art",
    description:
      "detailed pixel art scene with a limited color palette, clean pixel placement, and retro video game aesthetic",
  },
  {
    name: "sketch",
    displayName: "Pencil Sketch",
    description:
      "detailed pencil sketch with cross-hatching, varying line weights, and expressive shading on white paper",
  },
  {
    name: "stainedglass",
    displayName: "Stained Glass",
    description:
      "stained glass window design with bold black leading lines, jewel-toned translucent colors, and radiant light",
  },
  {
    name: "kpop",
    displayName: "K-Pop Demon Hunters",
    description:
      "stylish K-pop idol aesthetic fused with dark fantasy demon hunting, featuring characters in sleek idol outfits with glowing weapons, neon-lit supernatural battlegrounds, dramatic poses, vibrant hair colors, and manhwa-inspired linework",
  },
  {
    name: "fortnite",
    displayName: "Fortnite",
    description:
      "Fortnite-inspired 3D cartoon style with exaggerated proportions, vibrant saturated colors, cel-shaded characters, bold outlines, playful action poses, and a colorful stylized environment",
  },
  {
    name: "archer",
    displayName: "Archer",
    description:
      "Illustration in the exact art style of the attached reference image. Create ORIGINAL characters — do NOT copy any existing characters from the reference. The style features clean uniform-weight black outlines, flat cel-shaded fills, muted sophisticated colors, mid-century modern settings, and a cinematic spy-thriller atmosphere. Zero gradients, zero texture, zero painterly effects",
  },
  {
    name: "southpark",
    displayName: "South Park",
    description:
      "Illustration in the exact art style of the attached reference image. Create ORIGINAL characters — do NOT copy any existing characters, settings, or scenes from the reference. The style features clean digital 2D vector animation with flat solid colors, no gradients, no shading, simple geometric shapes, thin black outlines, and a minimal aesthetic",
  },
  {
    name: "futurama",
    displayName: "Futurama",
    description:
      "Illustration in the exact art style of the attached reference image. Create ORIGINAL characters — do NOT copy any existing characters from the reference. The style features clean uniform-weight black outlines, Groening-style large bulging round eyes, overbites, bulbous noses, bold saturated flat fills, and retro-futuristic settings. Colorful, whimsical, flat cel-shaded animation",
  },
  {
    name: "simpsons",
    displayName: "The Simpsons",
    description:
      "Illustration in the exact art style of the attached reference image. Create ORIGINAL characters — do NOT copy any existing characters from the reference. The style features thick uniform black outlines, bright yellow skin, huge circular white eyes with dot pupils, overbites, four-fingered hands, completely flat solid color fills with zero gradients or shading, and simple pastel-colored suburban settings. Bright, warm, cheerful flat 2D cel animation",
  },
  {
    name: "fallout",
    displayName: "Fallout",
    description:
      "Illustration in the exact art style of the attached reference image. Create ORIGINAL characters — do NOT copy any existing characters from the reference. The style features retro-futuristic 1950s Americana propaganda poster aesthetic, clean retro linework, warm faded colors (mustard yellow, teal, cream, rust red), exaggerated happy expressions, atomic age imagery, and optimistic Cold War-era graphic design",
  },
];

async function main() {
  console.log("Seeding built-in styles...");

  for (const style of BUILT_IN_STYLES) {
    const existing = await prisma.style.findFirst({
      where: { workspaceId: null, name: style.name },
    });

    if (existing) {
      await prisma.style.update({
        where: { id: existing.id },
        data: {
          displayName: style.displayName,
          description: style.description,
        },
      });
    } else {
      await prisma.style.create({
        data: {
          name: style.name,
          displayName: style.displayName,
          description: style.description,
          workspaceId: null,
        },
      });
    }
  }

  console.log("Done seeding built-in styles.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
