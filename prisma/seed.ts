// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.cardMapping.upsert({
    where: { uid_normalized: "04032A92D41391" },
    update: {},
    create: {
      uid_normalized: "04032A92D41391",
      destination_url: "https://example.com/welcome",
      label: "Demo card",
      enabled: true,
    },
  });
  console.log("Seed complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
