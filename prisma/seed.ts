import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL || "postgresql://localhost:5433/nocontext",
});
const prisma = new PrismaClient({ adapter });

const BUILT_IN_STYLES = [
  {
    name: "watercolor",
    displayName: "Watercolor",
    description:
      "Soft, flowing paintings with gentle color washes and visible brushstrokes",
    prompt:
      "soft watercolor painting with gentle washes of color, loose brushstrokes, and white paper showing through",
    isFree: true,
  },
  {
    name: "picasso",
    displayName: "Picasso / Cubism",
    description:
      "Abstract geometric shapes showing multiple perspectives at once",
    prompt:
      "cubist painting in the style of Pablo Picasso, with geometric shapes, multiple perspectives, and bold outlines",
    isFree: false,
  },
  {
    name: "vangogh",
    displayName: "Van Gogh / Post-Impressionist",
    description:
      "Swirling brushstrokes with vivid colors and emotional intensity",
    prompt:
      "painting in the style of Vincent van Gogh, with swirling brushstrokes, vivid colors, and emotional intensity",
    isFree: true,
  },
  {
    name: "monet",
    displayName: "Monet / Impressionist",
    description:
      "Soft light and dappled colors capturing fleeting atmospheric moments",
    prompt:
      "impressionist painting in the style of Claude Monet, with soft light, dappled colors, and atmospheric effects",
    isFree: true,
  },
  {
    name: "warhol",
    displayName: "Warhol / Pop Art",
    description:
      "Bold, flat colors with graphic outlines inspired by pop culture",
    prompt:
      "pop art print in the style of Andy Warhol, with bright flat colors, bold outlines, and repeated motifs",
    isFree: true,
  },
  {
    name: "hokusai",
    displayName: "Hokusai / Ukiyo-e",
    description:
      "Japanese woodblock prints with flowing lines and flat color areas",
    prompt:
      "Japanese woodblock print in the style of Hokusai, with flowing lines, flat color areas, and dynamic composition",
    isFree: true,
  },
  {
    name: "dali",
    displayName: "Dali / Surrealism",
    description:
      "Dreamlike landscapes with melting forms and impossible physics",
    prompt:
      "surrealist painting in the style of Salvador Dali, with melting forms, dreamlike landscapes, and impossible physics",
    isFree: false,
  },
  {
    name: "mondrian",
    displayName: "Mondrian / De Stijl",
    description:
      "Abstract grids of primary colors separated by bold black lines",
    prompt:
      "abstract geometric composition in the style of Piet Mondrian, with primary colors, black grid lines, and white space",
    isFree: false,
  },
  {
    name: "basquiat",
    displayName: "Basquiat / Neo-Expressionism",
    description:
      "Raw, energetic street art with bold marks and expressive symbols",
    prompt:
      "raw neo-expressionist painting in the style of Jean-Michel Basquiat, with bold marks, crowns, and street art energy",
    isFree: false,
  },
  {
    name: "rockwell",
    displayName: "Rockwell / Americana",
    description:
      "Warm, detailed illustrations with classic American storytelling charm",
    prompt:
      "Norman Rockwell-style illustration with warm Americana charm, detailed characters, and storytelling composition",
    isFree: true,
  },
  {
    name: "miyazaki",
    displayName: "Miyazaki / Studio Ghibli",
    description: "Lush, whimsical anime landscapes with a sense of wonder",
    prompt:
      "Studio Ghibli-style illustration with lush environments, whimsical characters, and a sense of wonder",
    isFree: false,
  },
  {
    name: "comic",
    displayName: "Comic Book",
    description:
      "Bold ink lines, halftone dots, and dynamic comic panel compositions",
    prompt:
      "vibrant comic book panel with bold ink lines, halftone dots, dynamic angles, and speech bubbles",
    isFree: false,
  },
  {
    name: "pixel",
    displayName: "Pixel Art",
    description:
      "Retro video game aesthetic with clean pixels and limited color palettes",
    prompt:
      "detailed pixel art scene with a limited color palette, clean pixel placement, and retro video game aesthetic",
    isFree: false,
  },
  {
    name: "sketch",
    displayName: "Pencil Sketch",
    description:
      "Hand-drawn pencil illustrations with cross-hatching and expressive shading",
    prompt:
      "detailed pencil sketch with cross-hatching, varying line weights, and expressive shading on white paper",
    isFree: true,
  },
  {
    name: "stainedglass",
    displayName: "Stained Glass",
    description: "Jewel-toned translucent colors with bold black leading lines",
    prompt:
      "stained glass window design with bold black leading lines, jewel-toned translucent colors, and radiant light",
    isFree: true,
  },
  {
    name: "kpop",
    displayName: "K-Pop Demon Hunters",
    description:
      "Stylish K-pop idol aesthetic fused with dark fantasy demon hunting",
    prompt:
      "stylish K-pop idol aesthetic fused with dark fantasy demon hunting, featuring characters in sleek idol outfits with glowing weapons, neon-lit supernatural battlegrounds, dramatic poses, vibrant hair colors, and manhwa-inspired linework",
    isFree: false,
  },
  {
    name: "fortnite",
    displayName: "Fortnite",
    description:
      "Vibrant 3D cartoon style with exaggerated proportions and bold outlines",
    prompt:
      "Fortnite-inspired 3D cartoon style with exaggerated proportions, vibrant saturated colors, cel-shaded characters, bold outlines, playful action poses, and a colorful stylized environment",
    isFree: false,
  },
  {
    name: "archer",
    displayName: "Archer",
    description:
      "Clean cel-shaded spy-thriller style with muted, sophisticated colors",
    prompt:
      "Illustration in the exact art style of the attached reference image. Create ORIGINAL characters — do NOT copy any existing characters from the reference. The style features clean uniform-weight black outlines, flat cel-shaded fills, muted sophisticated colors, mid-century modern settings, and a cinematic spy-thriller atmosphere. Zero gradients, zero texture, zero painterly effects",
    isFree: false,
  },
  {
    name: "southpark",
    displayName: "South Park",
    description:
      "Simple flat 2D animation with geometric shapes and minimal aesthetic",
    prompt:
      "Illustration in the exact art style of the attached reference image. Create ORIGINAL characters — do NOT copy any existing characters, settings, or scenes from the reference. The style features clean digital 2D vector animation with flat solid colors, no gradients, no shading, simple geometric shapes, thin black outlines, and a minimal aesthetic",
    isFree: false,
  },
  {
    name: "futurama",
    displayName: "Futurama",
    description:
      "Colorful retro-futuristic cartoon style with Groening-style characters",
    prompt:
      "Illustration in the exact art style of the attached reference image. Create ORIGINAL characters — do NOT copy any existing characters from the reference. The style features clean uniform-weight black outlines, Groening-style large bulging round eyes, overbites, bulbous noses, bold saturated flat fills, and retro-futuristic settings. Colorful, whimsical, flat cel-shaded animation",
    isFree: false,
  },
  {
    name: "simpsons",
    displayName: "The Simpsons",
    description:
      "Bright, cheerful flat animation with yellow skin and overbites",
    prompt:
      "Illustration in the exact art style of the attached reference image. Create ORIGINAL characters — do NOT copy any existing characters from the reference. The style features thick uniform black outlines, bright yellow skin, huge circular white eyes with dot pupils, overbites, four-fingered hands, completely flat solid color fills with zero gradients or shading, and simple pastel-colored suburban settings. Bright, warm, cheerful flat 2D cel animation",
    isFree: false,
  },
  {
    name: "fallout",
    displayName: "Fallout",
    description:
      "Retro-futuristic 1950s Americana with atomic age propaganda poster vibes",
    prompt:
      "Illustration in the exact art style of the attached reference image. Create ORIGINAL characters — do NOT copy any existing characters from the reference. The style features retro-futuristic 1950s Americana propaganda poster aesthetic, clean retro linework, warm faded colors (mustard yellow, teal, cream, rust red), exaggerated happy expressions, atomic age imagery, and optimistic Cold War-era graphic design",
    isFree: false,
  },
];

async function main() {
  console.log("🌱 Seeding database...\n");

  // Seed built-in styles
  console.log("🎨 Seeding built-in styles...");
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
          prompt: style.prompt,
          isFree: style.isFree,
        },
      });
    } else {
      await prisma.style.create({
        data: {
          name: style.name,
          displayName: style.displayName,
          description: style.description,
          prompt: style.prompt,
          isFree: style.isFree,
          workspaceId: null,
        },
      });
    }
  }
  console.log(`   ✓ Seeded ${BUILT_IN_STYLES.length} styles\n`);

  // Seed test user
  console.log("👤 Seeding test user...");
  let user = await prisma.user.findUnique({
    where: { email: "test@example.com" },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "test@example.com",
        name: "Test User",
        slackUserId: "U001",
        emailVerified: new Date(),
      },
    });
    console.log("   ✓ Created test user: test@example.com");
  } else {
    console.log("   ℹ Test user already exists");
  }

  // Seed test workspace (aligned with slackhog)
  console.log("\n🏢 Seeding test workspace...");
  let workspace = await prisma.workspace.findUnique({
    where: { slackTeamId: "T001DEV" },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        slug: "dev-test-workspace",
        slackTeamId: "T001DEV",
        slackTeamName: "Dev Test Workspace",
        slackBotToken: "xoxb-test-token",
        slackBotUserId: "UBOT001",
        installedByUserId: user.id,
        isActive: true,
        onboardingCompleted: true,
      },
    });
    console.log("   ✓ Created workspace: Dev Test Workspace");

    // Create workspace user
    await prisma.workspaceUser.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: "admin",
        isDefault: true,
      },
    });
    console.log("   ✓ Added user to workspace");

    // Create subscription
    await prisma.subscription.create({
      data: {
        workspaceId: workspace.id,
        stripeCustomerId: "cus_test_dev",
        tier: "TEAM",
        status: "ACTIVE",
        monthlyQuota: 100,
        maxChannels: 10,
        hasWatermark: false,
        imageSize: "1792x1024",
      },
    });
    console.log("   ✓ Created TEAM tier subscription");
  } else {
    console.log("   ℹ Test workspace already exists");
  }

  // Seed channels (aligned with slackhog channels)
  console.log("\n📺 Seeding channels...");
  const channelsToSeed = [
    {
      slackChannelId: "C000000001",
      channelName: "general",
    },
    {
      slackChannelId: "C000000002",
      channelName: "random",
    },
    {
      slackChannelId: "C000000003",
      channelName: "art-requests",
    },
    {
      slackChannelId: "C000000004",
      channelName: "dev-team",
    },
  ];

  for (const channelData of channelsToSeed) {
    const existing = await prisma.channel.findUnique({
      where: {
        workspaceId_slackChannelId: {
          workspaceId: workspace.id,
          slackChannelId: channelData.slackChannelId,
        },
      },
    });

    if (!existing) {
      await prisma.channel.create({
        data: {
          workspaceId: workspace.id,
          slackChannelId: channelData.slackChannelId,
          channelName: channelData.channelName,
          isActive: true,
          styleMode: "RANDOM",
        },
      });
      console.log(`   ✓ Created channel: #${channelData.channelName}`);
    } else {
      console.log(`   ℹ Channel #${channelData.channelName} already exists`);
    }
  }

  console.log("\n✅ Database seeding complete!\n");
  console.log("📊 Summary:");
  console.log(`   • ${BUILT_IN_STYLES.length} art styles`);
  console.log(`   • 1 test user (test@example.com)`);
  console.log(`   • 1 workspace (Dev Test Workspace)`);
  console.log(`   • 1 subscription (TEAM tier)`);
  console.log(`   • ${channelsToSeed.length} channels`);
  console.log("\n💡 Next steps:");
  console.log("   1. Seed slackhog: cd dev/slackhog && pnpm exec tsx seed.ts");
  console.log("   2. Start the app: pnpm dev");
  console.log("   3. Open slackhog GUI: http://localhost:9002");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
