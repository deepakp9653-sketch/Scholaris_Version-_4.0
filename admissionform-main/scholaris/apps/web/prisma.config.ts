import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
const cleanUrl = rawUrl.replace(/[\?&]channel_binding=require/g, "");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: cleanUrl,
  },
});
