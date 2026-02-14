import OpenAI from "openai";
import sharp from "sharp";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { getStylePrompt } from "../src/lib/styles";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface LandingImage {
  filename: string;
  quote: string;
  styleId: string;
  attribution: string;
}

function buildPrompt(quote: string, styleId: string): string {
  const stylePrompt = getStylePrompt(styleId);

  return `Create a ${stylePrompt} illustration inspired by this quote: "${quote}"

The image should:
- Capture the humor or absurdity of the quote
- Be whimsical and lighthearted
- Not contain any text or words in the image
- Be suitable for a workplace setting (no violence, explicit content)`;
}

async function generateAndSave(image: LandingImage): Promise<void> {
  const prompt = buildPrompt(image.quote, image.styleId);

  console.log(`\nGenerating: ${image.filename}`);
  console.log(`  Quote: "${image.quote}" — ${image.attribution}`);
  console.log(`  Style: ${image.styleId}`);
  console.log(`  Prompt: ${prompt.slice(0, 100)}...`);

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1792x1024",
    quality: "standard",
    response_format: "url",
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error(`No image URL returned for ${image.filename}`);
  }

  console.log(`  Downloading...`);
  const imageResponse = await fetch(imageUrl);
  const arrayBuffer = await imageResponse.arrayBuffer();
  // Center-crop 1792x1024 DALL-E output to 4:3 (1360x1020)
  const buffer = await sharp(Buffer.from(arrayBuffer))
    .extract({ left: 216, top: 2, width: 1360, height: 1020 })
    .toBuffer();

  const outputPath = resolve(
    __dirname,
    "../public/images/landing",
    image.filename,
  );
  writeFileSync(outputPath, buffer);
  console.log(
    `  Saved to: ${outputPath} (${(buffer.length / 1024).toFixed(0)} KB)`,
  );
}

// Define all landing page images
const LANDING_IMAGES: LandingImage[] = [
  {
    filename: "hero-vangogh.png",
    quote: "I'm not saying it was aliens, but it was definitely the intern",
    styleId: "vangogh",
    attribution: "Mike, Engineering",
  },
  // Example gallery images
  {
    filename: "gallery-goat-cubism.png",
    quote: "Someone let a goat into the conference room again",
    styleId: "picasso",
    attribution: "VP of Sales",
  },
  {
    filename: "gallery-sword-popart.png",
    quote: "There's a sword in the supply closet and HR won't explain it",
    styleId: "warhol",
    attribution: "Intern",
  },
  {
    filename: "gallery-love-popart.png",
    quote: "I just mass-replied 'love you' to the entire company",
    styleId: "warhol",
    attribution: "Head of Marketing",
  },
  {
    filename: "gallery-seagull-hokusai.png",
    quote: "I just watched the CEO chase a seagull across the parking lot",
    styleId: "hokusai",
    attribution: "Junior Dev",
  },
  {
    filename: "gallery-duck-ghibli.png",
    quote: "Why is there a duck in the server room?",
    styleId: "miyazaki",
    attribution: "CEO",
  },
  {
    filename: "gallery-plants-watercolor.png",
    quote: "The plants in accounting have become sentient",
    styleId: "watercolor",
    attribution: "Facilities",
  },
  {
    filename: "gallery-throne-vangogh.png",
    quote:
      "The intern built a throne out of shipping boxes and won't come down",
    styleId: "vangogh",
    attribution: "Senior Engineer",
  },
  {
    filename: "gallery-printer-dali.png",
    quote: "The printer is haunted and I have evidence",
    styleId: "dali",
    attribution: "Office Manager",
  },
  {
    filename: "gallery-raccoon-pixel.png",
    quote: "A raccoon got into the server room and now it runs better",
    styleId: "pixel",
    attribution: "DevOps",
  },
  // Styles showcase images (one per style)
  {
    filename: "showcase-watercolor.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "watercolor",
    attribution: "Jeff, Operations",
  },
  {
    filename: "showcase-picasso.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "picasso",
    attribution: "Jeff, Operations",
  },
  {
    filename: "showcase-vangogh.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "vangogh",
    attribution: "Jeff, Operations",
  },
  {
    filename: "showcase-monet.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "monet",
    attribution: "Jeff, Operations",
  },
  {
    filename: "showcase-warhol.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "warhol",
    attribution: "Jeff, Operations",
  },
  {
    filename: "showcase-hokusai.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "hokusai",
    attribution: "Jeff, Operations",
  },
  {
    filename: "showcase-dali.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "dali",
    attribution: "Jeff, Operations",
  },
  {
    filename: "showcase-mondrian.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "mondrian",
    attribution: "Jeff, Operations",
  },
  {
    filename: "showcase-basquiat.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "basquiat",
    attribution: "Jeff, Operations",
  },
  {
    filename: "showcase-rockwell.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "rockwell",
    attribution: "Jeff, Operations",
  },
  {
    filename: "showcase-miyazaki.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "miyazaki",
    attribution: "Jeff, Operations",
  },
  {
    filename: "showcase-comic.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "comic",
    attribution: "Jeff, Operations",
  },
  {
    filename: "showcase-pixel.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "pixel",
    attribution: "Jeff, Operations",
  },
  {
    filename: "showcase-sketch.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "sketch",
    attribution: "Jeff, Operations",
  },
  {
    filename: "showcase-stainedglass.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "stainedglass",
    attribution: "Jeff, Operations",
  },
  // K-Pop Demon Hunters
  {
    filename: "showcase-kpop.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "kpop",
    attribution: "Jeff, Operations",
  },
  {
    filename: "gallery-dancebattle-kpop.png",
    quote:
      "The new hire showed up in full idol gear and challenged the CEO to a dance battle",
    styleId: "kpop",
    attribution: "HR Director",
  },
  // Fortnite
  {
    filename: "showcase-fortnite.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "fortnite",
    attribution: "Jeff, Operations",
  },
  {
    filename: "gallery-victory-fortnite.png",
    quote:
      "Someone left a Victory Royale banner on the whiteboard and nobody will take it down",
    styleId: "fortnite",
    attribution: "Product Manager",
  },
];

async function main() {
  const target = process.argv[2]; // optional: pass a filename to generate just one

  const images = target
    ? LANDING_IMAGES.filter((i) => i.filename === target)
    : LANDING_IMAGES;

  if (images.length === 0) {
    console.error(`No image found matching "${target}"`);
    process.exit(1);
  }

  console.log(`Generating ${images.length} landing page image(s)...`);

  for (const image of images) {
    await generateAndSave(image);
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
