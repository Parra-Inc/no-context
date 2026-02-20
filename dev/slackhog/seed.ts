import { db, queries } from "./src/lib/db";

const SEED_USERS = [
  {
    id: "U001",
    name: "alice",
    real_name: "Alice Johnson",
    avatar_url: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: "U002",
    name: "bob",
    real_name: "Bob Smith",
    avatar_url: "https://i.pravatar.cc/150?img=2",
  },
  {
    id: "U003",
    name: "charlie",
    real_name: "Charlie Davis",
    avatar_url: "https://i.pravatar.cc/150?img=3",
  },
  {
    id: "UBOT001",
    name: "no-context-bot",
    real_name: "No Context Bot",
    avatar_url: "https://i.pravatar.cc/150?img=68",
  },
];

const SEED_CHANNELS = [
  {
    id: "C000000001",
    name: "general",
    topic: "General discussion",
    is_private: 0,
  },
  {
    id: "C000000002",
    name: "random",
    topic: "Random chatter and off-topic discussions",
    is_private: 0,
  },
  {
    id: "C000000003",
    name: "art-requests",
    topic: "Request and share AI-generated artwork",
    is_private: 0,
  },
  {
    id: "C000000004",
    name: "dev-team",
    topic: "Private channel for the development team",
    is_private: 1,
  },
];

const SEED_MESSAGES: Array<{
  channel_id: string;
  user_id: string;
  text: string;
}> = [];

async function seed() {
  console.log("🌱 Seeding slackhog database...\n");

  const database = db();

  // Seed users
  console.log("👥 Creating users...");
  for (const user of SEED_USERS) {
    try {
      queries.createUser.run(
        user.id,
        user.name,
        user.real_name,
        user.avatar_url,
        Date.now(),
      );
      console.log(`   ✓ Created user: ${user.name} (${user.real_name})`);
    } catch (error) {
      console.log(`   ℹ User ${user.name} already exists, skipping`);
    }
  }

  // Seed channels
  console.log("\n📺 Creating channels...");
  for (const channel of SEED_CHANNELS) {
    try {
      queries.createChannel.run(
        channel.id,
        channel.name,
        channel.topic,
        channel.is_private,
        Date.now(),
      );
      console.log(
        `   ✓ Created channel: #${channel.name} ${channel.is_private ? "(private)" : ""}`,
      );
    } catch (error) {
      console.log(`   ℹ Channel #${channel.name} already exists, skipping`);
    }
  }

  // Seed messages
  console.log("\n💬 Creating messages...");
  for (const message of SEED_MESSAGES) {
    const ts = `${Date.now()}.${Math.random().toString(36).substring(7)}`;
    try {
      queries.createMessage.run(
        ts,
        message.channel_id,
        message.user_id,
        message.text,
        null,
        Date.now(),
      );
      const channel = SEED_CHANNELS.find((c) => c.id === message.channel_id);
      const user = SEED_USERS.find((u) => u.id === message.user_id);
      console.log(
        `   ✓ Message in #${channel?.name} from ${user?.name}: "${message.text.substring(0, 50)}..."`,
      );
    } catch (error) {
      console.log(`   ⚠ Failed to create message: ${error}`);
    }
  }

  console.log("\n✅ Slackhog seeding complete!\n");
  console.log("🔗 Slackhog GUI: http://localhost:9002");
  console.log("📊 Seeded:");
  console.log(`   • ${SEED_USERS.length} users`);
  console.log(`   • ${SEED_CHANNELS.length} channels`);
  console.log(`   • ${SEED_MESSAGES.length} messages`);
}

seed().catch((error) => {
  console.error("❌ Error seeding:", error);
  process.exit(1);
});
