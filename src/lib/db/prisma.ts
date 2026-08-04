import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { createPGlitePool } from "./pglite-adapter";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

let activePool: Pool | null = null;
let calibrationPromise: Promise<void> | null = null;

export async function ensureDbCalibrated() {
  if (!activePool) return;
  if (!calibrationPromise) {
    calibrationPromise = (async () => {
      try {
        await activePool.query(`
          ALTER TABLE admission_record ADD COLUMN IF NOT EXISTS cap_candidate_id uuid;
          ALTER TABLE admission_record ADD COLUMN IF NOT EXISTS excel_row_number int;
          ALTER TABLE admission_record ADD COLUMN IF NOT EXISTS excel_synced_at timestamptz;
          ALTER TABLE admission_record ADD COLUMN IF NOT EXISTS sync_status text DEFAULT 'DRAFT';
          ALTER TABLE admission_record ADD COLUMN IF NOT EXISTS voter_registered_yn text;
          ALTER TABLE admission_record ADD COLUMN IF NOT EXISTS epic_card_yn text;
          ALTER TABLE admission_record ADD COLUMN IF NOT EXISTS epic_number text;
          ALTER TABLE form1_application ADD COLUMN IF NOT EXISTS hsc_chemistry_subject_name text DEFAULT 'Chemistry';

          CREATE TABLE IF NOT EXISTS academic_batch (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            academic_year text NOT NULL,
            admission_status text NOT NULL,
            branch_code text NOT NULL,
            working_excel_path text NOT NULL,
            next_free_row int NOT NULL DEFAULT 15,
            finalized_at timestamptz,
            created_at timestamptz NOT NULL DEFAULT now(),
            CONSTRAINT unq_academic_batch UNIQUE (academic_year, branch_code, admission_status)
          );

          CREATE TABLE IF NOT EXISTS excel_sync_audit (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id uuid NOT NULL REFERENCES admission_record(id) ON DELETE CASCADE,
            batchId uuid NOT NULL,
            action text NOT NULL,
            detail jsonb NOT NULL,
            performed_by_id text NOT NULL,
            performed_at timestamptz NOT NULL DEFAULT now()
          );
        `);
        console.log("Database schema auto-calibrated successfully.");
      } catch (err) {
        console.warn("Database schema auto-calibration note:", err);
      }
    })();
  }
  await calibrationPromise;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString && !connectionString.includes("localhost:5432")) {
    const cleanUrl = connectionString.replace(/[\?&]channel_binding=require/g, "");
    activePool = new Pool({
      connectionString: cleanUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    activePool.on("error", (err) => {
      console.warn("Postgres pool idle network note:", err.message);
    });
    ensureDbCalibrated();
  } else {
    // Fallback to embedded WASM PGlite Postgres for zero-config local execution
    activePool = createPGlitePool() as unknown as Pool;
  }

  const adapter = new PrismaPg(activePool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
