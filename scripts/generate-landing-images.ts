import OpenAI from "openai";
import sharp from "sharp";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";
import { getStylePrompt } from "../src/lib/styles";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface LandingImage {
  subdir: "gallery" | "showcase" | "hero";
  filename: string;
  quote: string;
  styleId: string;
  attribution: string;
  referenceImage?: string; // path relative to project root
}

function buildPrompt(
  quote: string,
  styleId: string,
  hasReferenceImage: boolean,
): string {
  if (hasReferenceImage) {
    return `Illustrate this quote: "${quote}"

Use the exact art style of the attached reference image — match the line work, coloring, and aesthetic.
Create ORIGINAL characters and an ORIGINAL scene depicting the quote — do NOT copy any characters, settings, or compositions from the reference image.

The image should:
- Depict the scene or situation described in the quote
- Capture the humor or absurdity of the quote
- Be whimsical and lighthearted
- Not contain any text or words in the image
- Be suitable for a workplace setting (no violence, explicit content)`;
  }

  const stylePrompt = getStylePrompt(styleId);

  return `Create a ${stylePrompt} illustration inspired by this quote: "${quote}"

The image should:
- Capture the humor or absurdity of the quote
- Be whimsical and lighthearted
- Not contain any text or words in the image
- Be suitable for a workplace setting (no violence, explicit content)`;
}

async function generateAndSave(image: LandingImage): Promise<void> {
  const prompt = buildPrompt(
    image.quote,
    image.styleId,
    !!image.referenceImage,
  );

  console.log(`\nGenerating: ${image.subdir}/${image.filename}`);
  console.log(`  Quote: "${image.quote}" — ${image.attribution}`);
  console.log(`  Style: ${image.styleId}`);
  console.log(`  Prompt: ${prompt.slice(0, 100)}...`);

  let rawBuffer: Buffer;

  if (image.referenceImage) {
    // Use gpt-image-1 with reference image via curl
    // (Node.js built-in FormData doesn't work with OpenAI's images/edits endpoint)
    const refPath = resolve(__dirname, "..", image.referenceImage);
    console.log(`  Using reference image: ${refPath}`);

    const curlResult = execSync(
      `curl -s https://api.openai.com/v1/images/edits ` +
        `-H "Authorization: Bearer ${process.env.OPENAI_API_KEY}" ` +
        `-F "model=gpt-image-1" ` +
        `-F "prompt=${prompt.replace(/"/g, '\\"')}" ` +
        `-F "size=1536x1024" ` +
        `-F "n=1" ` +
        `-F "image=@${refPath}"`,
      { maxBuffer: 50 * 1024 * 1024 },
    );

    const json = JSON.parse(curlResult.toString()) as {
      data?: Array<{ b64_json?: string; url?: string }>;
      error?: { message: string };
    };
    if (json.error) {
      throw new Error(`gpt-image-1 edit failed: ${json.error.message}`);
    }
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error(`No image data returned for ${image.filename}`);
    }
    rawBuffer = Buffer.from(b64, "base64");
  } else {
    // Use dall-e-3 (no reference image)
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
    rawBuffer = Buffer.from(arrayBuffer);
  }

  // Center-crop to 4:3 (1360x1020)
  const { width: srcWidth, height: srcHeight } = (await sharp(
    rawBuffer,
  ).metadata()) as { width: number; height: number };
  const targetRatio = 4 / 3;
  const srcRatio = srcWidth / srcHeight;
  let cropWidth: number, cropHeight: number, cropLeft: number, cropTop: number;
  if (srcRatio > targetRatio) {
    cropHeight = srcHeight;
    cropWidth = Math.round(srcHeight * targetRatio);
    cropLeft = Math.round((srcWidth - cropWidth) / 2);
    cropTop = 0;
  } else {
    cropWidth = srcWidth;
    cropHeight = Math.round(srcWidth / targetRatio);
    cropLeft = 0;
    cropTop = Math.round((srcHeight - cropHeight) / 2);
  }

  const buffer = await sharp(rawBuffer)
    .extract({
      left: cropLeft,
      top: cropTop,
      width: cropWidth,
      height: cropHeight,
    })
    .resize(1360, 1020)
    .toBuffer();

  const outputPath = resolve(
    __dirname,
    "../public/images/landing",
    image.subdir,
    image.filename,
  );
  writeFileSync(outputPath, buffer);
  console.log(
    `  Saved to: ${outputPath} (${(buffer.length / 1024).toFixed(0)} KB)`,
  );
}

// Define all landing page images
const LANDING_IMAGES: LandingImage[] = [
  // Hero
  {
    subdir: "hero",
    filename: "vangogh.png",
    quote: "I'm not saying it was aliens, but it was definitely the intern",
    styleId: "vangogh",
    attribution: "Mike, Engineering",
  },
  // Gallery images
  {
    subdir: "gallery",
    filename: "goat-cubism.png",
    quote: "Someone let a goat into the conference room again",
    styleId: "picasso",
    attribution: "VP of Sales",
  },
  {
    subdir: "gallery",
    filename: "sword-popart.png",
    quote: "There's a sword in the supply closet and HR won't explain it",
    styleId: "warhol",
    attribution: "Intern",
  },
  {
    subdir: "gallery",
    filename: "love-popart.png",
    quote: "I just mass-replied 'love you' to the entire company",
    styleId: "warhol",
    attribution: "Head of Marketing",
  },
  {
    subdir: "gallery",
    filename: "seagull-hokusai.png",
    quote: "I just watched the CEO chase a seagull across the parking lot",
    styleId: "hokusai",
    attribution: "Junior Dev",
  },
  {
    subdir: "gallery",
    filename: "duck-ghibli.png",
    quote: "Why is there a duck in the server room?",
    styleId: "miyazaki",
    attribution: "CEO",
  },
  {
    subdir: "gallery",
    filename: "plants-watercolor.png",
    quote: "The plants in accounting have become sentient",
    styleId: "watercolor",
    attribution: "Facilities",
  },
  {
    subdir: "gallery",
    filename: "throne-vangogh.png",
    quote:
      "The intern built a throne out of shipping boxes and won't come down",
    styleId: "vangogh",
    attribution: "Senior Engineer",
  },
  {
    subdir: "gallery",
    filename: "printer-dali.png",
    quote: "The printer is haunted and I have evidence",
    styleId: "dali",
    attribution: "Office Manager",
  },
  {
    subdir: "gallery",
    filename: "raccoon-pixel.png",
    quote: "A raccoon got into the server room and now it runs better",
    styleId: "pixel",
    attribution: "DevOps",
  },
  {
    subdir: "gallery",
    filename: "dancebattle-kpop.png",
    quote:
      "The new hire showed up in full idol gear and challenged the CEO to a dance battle",
    styleId: "kpop",
    attribution: "HR Director",
  },
  {
    subdir: "gallery",
    filename: "barricade-fortnite.png",
    quote:
      "The marketing team barricaded themselves in the conference room and declared it a sovereign nation",
    styleId: "fortnite",
    attribution: "Product Manager",
  },
  {
    subdir: "gallery",
    filename: "firealarm-comic.png",
    quote: "The fire alarm went off and the CEO just kept eating his sandwich",
    styleId: "comic",
    attribution: "Security Guard",
  },
  {
    subdir: "gallery",
    filename: "horse-rockwell.png",
    quote:
      "Someone brought a horse to bring-your-pet-to-work day and it won't leave",
    styleId: "rockwell",
    attribution: "Receptionist",
  },
  {
    subdir: "gallery",
    filename: "dark-archer.png",
    quote:
      "The VP just announced he's going dark and won't be reachable for the rest of the quarter",
    styleId: "archer",
    attribution: "Executive Assistant",
    referenceImage: "public/images/examples/archer.jpg",
  },
  {
    subdir: "gallery",
    filename: "badtime-southpark.png",
    quote: "The CFO said our Q3 numbers are gonna have a bad time",
    styleId: "southpark",
    attribution: "Finance Analyst",
    referenceImage: "public/images/examples/south-park.jpg",
  },
  {
    subdir: "gallery",
    filename: "wifi-futurama.png",
    quote:
      "Good news everyone, the WiFi password is finally being changed from password123",
    styleId: "futurama",
    attribution: "IT Director",
    referenceImage: "public/images/examples/futurama.jpg",
  },
  {
    subdir: "gallery",
    filename: "donut-simpsons.png",
    quote:
      "Someone ate every donut from the break room and left a handwritten apology on a napkin",
    styleId: "simpsons",
    attribution: "Office Manager",
    referenceImage: "public/images/examples/simpsons.jpg",
  },
  {
    subdir: "gallery",
    filename: "bunker-fallout.png",
    quote:
      "IT converted the basement into a bunker and now they won't come out until the quarterly review is over",
    styleId: "fallout",
    attribution: "CTO",
    referenceImage: "public/images/examples/fallout.jpg",
  },
  {
    subdir: "gallery",
    filename: "victory-fortnite.png",
    quote: "The intern just declared a victory royale after fixing the build",
    styleId: "fortnite",
    attribution: "Tech Lead",
  },
  // Showcase images (one per style)
  {
    subdir: "showcase",
    filename: "watercolor.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "watercolor",
    attribution: "Jeff, Operations",
  },
  {
    subdir: "showcase",
    filename: "picasso.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "picasso",
    attribution: "Jeff, Operations",
  },
  {
    subdir: "showcase",
    filename: "vangogh.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "vangogh",
    attribution: "Jeff, Operations",
  },
  {
    subdir: "showcase",
    filename: "monet.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "monet",
    attribution: "Jeff, Operations",
  },
  {
    subdir: "showcase",
    filename: "warhol.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "warhol",
    attribution: "Jeff, Operations",
  },
  {
    subdir: "showcase",
    filename: "hokusai.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "hokusai",
    attribution: "Jeff, Operations",
  },
  {
    subdir: "showcase",
    filename: "dali.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "dali",
    attribution: "Jeff, Operations",
  },
  {
    subdir: "showcase",
    filename: "mondrian.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "mondrian",
    attribution: "Jeff, Operations",
  },
  {
    subdir: "showcase",
    filename: "basquiat.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "basquiat",
    attribution: "Jeff, Operations",
  },
  {
    subdir: "showcase",
    filename: "rockwell.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "rockwell",
    attribution: "Jeff, Operations",
  },
  {
    subdir: "showcase",
    filename: "miyazaki.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "miyazaki",
    attribution: "Jeff, Operations",
  },
  {
    subdir: "showcase",
    filename: "comic.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "comic",
    attribution: "Jeff, Operations",
  },
  {
    subdir: "showcase",
    filename: "pixel.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "pixel",
    attribution: "Jeff, Operations",
  },
  {
    subdir: "showcase",
    filename: "sketch.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "sketch",
    attribution: "Jeff, Operations",
  },
  {
    subdir: "showcase",
    filename: "stainedglass.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "stainedglass",
    attribution: "Jeff, Operations",
  },
  {
    subdir: "showcase",
    filename: "kpop.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "kpop",
    attribution: "Jeff, Operations",
  },
  {
    subdir: "showcase",
    filename: "fortnite.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "fortnite",
    attribution: "Jeff, Operations",
  },
  {
    subdir: "showcase",
    filename: "archer.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "archer",
    attribution: "Jeff, Operations",
    referenceImage: "public/images/examples/archer.jpg",
  },
  {
    subdir: "showcase",
    filename: "southpark.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "southpark",
    attribution: "Jeff, Operations",
    referenceImage: "public/images/examples/south-park.jpg",
  },
  {
    subdir: "showcase",
    filename: "futurama.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "futurama",
    attribution: "Jeff, Operations",
    referenceImage: "public/images/examples/futurama.jpg",
  },
  {
    subdir: "showcase",
    filename: "simpsons.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "simpsons",
    attribution: "Jeff, Operations",
    referenceImage: "public/images/examples/simpsons.jpg",
  },
  {
    subdir: "showcase",
    filename: "fallout.png",
    quote: "The printer is on fire again and honestly I think it's personal",
    styleId: "fallout",
    attribution: "Jeff, Operations",
    referenceImage: "public/images/examples/fallout.jpg",
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
