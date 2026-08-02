require("dotenv").config();
const { Pool } = require("pg");

async function runCalibration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("No DATABASE_URL found");
    return;
  }
  const cleanUrl = connectionString.replace(/[\?&]channel_binding=require/g, "");
  const pool = new Pool({ connectionString: cleanUrl });

  console.log("Connecting to PostgreSQL database...");
  try {
    await pool.query(`
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
        batch_id uuid NOT NULL,
        action text NOT NULL,
        detail jsonb NOT NULL,
        performed_by_id text NOT NULL,
        performed_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    console.log("Successfully created academic_batch and excel_sync_audit tables in database!");
  } catch (err) {
    console.error("Calibration error:", err);
  } finally {
    await pool.end();
  }
}

runCalibration();
