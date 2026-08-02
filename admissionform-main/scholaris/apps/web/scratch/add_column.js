import "dotenv/config";
import pg from "pg";

async function addColumn() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(`
      ALTER TABLE app_user ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
      ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'PRINCIPAL';
      ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'CLERK_OPERATOR';
    `);
    console.log("Successfully added is_active column and enum values to PostgreSQL database!");
  } catch (err) {
    console.error("Error adding column / enum values:", err);
  } finally {
    await client.end();
  }
}

addColumn();
