import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var ${name}.`);
    console.error(
      "Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' ADMIN_FIRST_NAME=... ADMIN_LAST_NAME=... npx tsx prisma/create-admin.ts",
    );
    process.exit(1);
  }
  return value;
}

async function main() {
  const email = requireEnv("ADMIN_EMAIL").toLowerCase();
  const password = requireEnv("ADMIN_PASSWORD");
  const firstName = process.env.ADMIN_FIRST_NAME || "Admin";
  const lastName = process.env.ADMIN_LAST_NAME || "User";

  if (password.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      firstName,
      lastName,
    },
    create: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Admin user ready: ${user.email} (id: ${user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
