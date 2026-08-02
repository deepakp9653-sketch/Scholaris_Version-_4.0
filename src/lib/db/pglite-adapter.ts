import { PGlite } from "@electric-sql/pglite";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

let pgliteInstance: PGlite | null = null;
let initializationPromise: Promise<void> | null = null;
let initialized = false;

export function getPGlite() {
  if (!pgliteInstance) {
    // Use INIT_CWD (set by npm) which is always a real string path, not a URL
    const baseDir = process.env.INIT_CWD
      ?? process.env.PWD
      ?? "C:\\Users\\Prateek pandey\\Desktop\\Scholaris Doc full\\admissionform-main\\scholaris\\apps\\web";
    const dataDir = path.join(String(baseDir), "scholaris-pgdata");
    pgliteInstance = new PGlite(dataDir);
  }
  return pgliteInstance;
}

function findSchemaSql(): string | null {
  const candidates = [
    // From apps/web → up 2 → admissionform-main/
    path.resolve(process.cwd(), "../../09_NEON_SCHEMA.sql"),
    // From apps/web → up 3 → scholaris parent /
    path.resolve(process.cwd(), "../../../09_NEON_SCHEMA.sql"),
    // Absolute known path
    "C:/Users/Prateek pandey/Desktop/Scholaris Doc full/admissionform-main/09_NEON_SCHEMA.sql",
    path.resolve(process.cwd(), "09_NEON_SCHEMA.sql"),
    path.resolve(process.cwd(), "prisma/09_NEON_SCHEMA.sql"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  return null;
}

async function ensureInitialized(db: PGlite) {
  if (initialized) return;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    try {
      await createInlineSchema(db);
      await seedData(db);
      initialized = true;
    } catch (e) {
      console.error("Error initializing PGlite schema:", e);
    }
  })();

  return initializationPromise;
}

async function seedData(db: PGlite) {
  console.log("Seeding initial PGlite data...");
  const passwordHash = await bcrypt.hash("Admin@Scholaris2025", 12);
  const institutionId = "550e8400-e29b-41d4-a716-446655440000";

  // Upsert institution
  await db.query(`
    INSERT INTO institution (id, name, address, phone, website)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO NOTHING
  `, [
    institutionId,
    "TSSM's Bhivarabai Sawant College of Engineering & Research",
    "Narhe, Pune, Maharashtra",
    "020-24301234",
    "https://bscoer.edu.in"
  ]);

  const users = [
    { name: "Scholaris Admin", email: "admin@scholaris.edu", role: "SystemAdmin" },
    { name: "Front Desk Admin", email: "frontdesk@bscoer.edu.in", role: "FrontDesk" },
    { name: "Verification Admin", email: "verification@bscoer.edu.in", role: "VerificationAdmin" },
    { name: "Higher Authority", email: "hod@bscoer.edu.in", role: "HigherAuthority" },
    { name: "System Admin", email: "admin@bscoer.edu.in", role: "SystemAdmin" },
  ];

  for (const u of users) {
    await db.query(`
      INSERT INTO app_user (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, [u.name, u.email, passwordHash, u.role]);
  }

  console.log("PGlite database seed complete.");
}

async function createInlineSchema(db: PGlite) {
  // Minimal schema to get app running if SQL file not found
  await db.exec(`
    DO $$ BEGIN
      CREATE TYPE admission_status AS ENUM ('DRAFT','FORMS_COMPLETE','DOCS_IN_PROGRESS','DOCS_VERIFIED','FEE_RECORDED','READY_TO_PRINT','PRINTED','PENDING_FINAL_VERIFICATION','ADMITTED','ON_HOLD','REJECTED');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE user_role_enum AS ENUM ('FrontDesk','VerificationAdmin','HigherAuthority','SystemAdmin');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE doc_status_enum AS ENUM ('NOT_UPLOADED','UPLOADED_PENDING_REVIEW','VERIFIED','REJECTED_REUPLOAD');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE fee_status_enum AS ENUM ('Unpaid','Partially_Paid','Fully_Paid');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE payment_mode_enum AS ENUM ('Cash','UPI','Bank_to_Bank','RTGS','DD');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE verification_action_enum AS ENUM ('FORMS_SAVE_PASSWORD','DOC_VERIFIED','FINAL_VERIFICATION_PASSWORD','STATUS_CHANGE','UNLOCK');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE admission_type_enum AS ENUM ('FE','DSE');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE upload_method_enum AS ENUM ('scan','drag_drop','browse');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE file_type_enum AS ENUM ('image','pdf');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE TABLE IF NOT EXISTS institution (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      address text,
      phone text,
      website text,
      crest_asset_ref text,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS app_user (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      email text UNIQUE NOT NULL,
      password_hash text NOT NULL,
      role user_role_enum NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS admission_record (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      status admission_status NOT NULL DEFAULT 'DRAFT',
      institution_id uuid NOT NULL REFERENCES institution(id),
      assigned_operator_id uuid REFERENCES app_user(id),
      cap_candidate_id uuid,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      locked_at timestamptz,
      hold_reason text,
      rejected_reason text
    );

    CREATE TABLE IF NOT EXISTS student_profile (
      admission_record_id uuid PRIMARY KEY REFERENCES admission_record(id) ON DELETE CASCADE,
      full_name_surname text,
      full_name_first text,
      full_name_father text,
      father_name text,
      mother_name text,
      date_of_birth date,
      gender text,
      blood_group text,
      religion_caste text,
      mobile_no text,
      email text,
      branch_course text,
      category text,
      admission_year_start int,
      admission_year_end int,
      correspondence_address text,
      correspondence_pin text,
      correspondence_tel_no text,
      permanent_address text,
      permanent_pin text,
      permanent_tel_no text,
      aadhar_no_encrypted bytea,
      contact_tel_no text,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS form1_application (
      admission_record_id uuid PRIMARY KEY REFERENCES admission_record(id) ON DELETE CASCADE,
      admission_quota text,
      admission_category text,
      home_university text,
      mother_tongue text,
      ssc_marks_english_obtained numeric,
      ssc_marks_english_out_of numeric,
      ssc_marks_maths_obtained numeric,
      ssc_marks_maths_out_of numeric,
      ssc_grand_total_obtained numeric,
      ssc_grand_total_out_of numeric,
      ssc_percentage numeric,
      ssc_year_of_passing int,
      hsc_physics_obtained numeric,
      hsc_physics_out_of numeric,
      hsc_chemistry_obtained numeric,
      hsc_chemistry_out_of numeric,
      hsc_maths_obtained numeric,
      hsc_maths_out_of numeric,
      hsc_pcm_total_obtained numeric,
      hsc_pcm_total_out_of numeric,
      hsc_grand_total_obtained numeric,
      hsc_grand_total_out_of numeric,
      hsc_year_of_passing int,
      cet_physics_obtained numeric,
      cet_physics_out_of numeric,
      cet_chemistry_obtained numeric,
      cet_chemistry_out_of numeric,
      cet_maths_obtained numeric,
      cet_maths_out_of numeric,
      cet_pcm_total_obtained numeric,
      cet_pcm_total_out_of numeric,
      cet_exam_seat_no text,
      cet_merit_no text,
      aieee_marks text,
      diploma_marks_obtained numeric,
      diploma_marks_out_of numeric,
      diploma_branch_course text,
      diploma_bte_enrollment_no text,
      diploma_year_of_passing int,
      annual_income_of_parent numeric,
      date_field date,
      place_field text,
      office_use_eligible_for text,
      office_use_branch text,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS form2_document_checklist (
      admission_record_id uuid PRIMARY KEY REFERENCES admission_record(id) ON DELETE CASCADE,
      admission_type text,
      cap_id text,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS checklist_item (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      form2_id uuid NOT NULL REFERENCES form2_document_checklist(admission_record_id) ON DELETE CASCADE,
      sr_no int NOT NULL,
      document_name text NOT NULL,
      required boolean NOT NULL DEFAULT false,
      UNIQUE(form2_id, sr_no)
    );

    CREATE TABLE IF NOT EXISTS form3_eligibility (
      admission_record_id uuid PRIMARY KEY REFERENCES admission_record(id) ON DELETE CASCADE,
      course_name text,
      course_year text,
      applicant_type text,
      nationality text,
      religion text,
      category_tick text,
      belongs_to_reserved_yn boolean,
      physically_disabled_yn boolean,
      physically_disabled_type text,
      qual_course_name text,
      qual_duration text,
      qual_university text,
      qual_college_dept text,
      qual_seat_no text,
      qual_month_year_passing text,
      qual_percentage numeric,
      qual_class_grade text,
      gap_last_exam_name text,
      gap_seat_no text,
      gap_month_year_passing text,
      gap_percentage numeric,
      gap_class_grade text,
      minority_yn boolean,
      minority_linguistic boolean,
      minority_religion boolean,
      office_receipt_no text,
      office_date date,
      office_eligible_status text,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS form4_anti_ragging_affidavit (
      admission_record_id uuid PRIMARY KEY REFERENCES admission_record(id) ON DELETE CASCADE,
      full_name_with_enrollment text,
      parent_name text,
      institution_name text DEFAULT 'TSSM''s Bhivarabai Sawant College of Engineering & Research',
      declaration_day text,
      declaration_month text,
      declaration_year text,
      deponent_name text,
      verification_place text,
      verification_day text,
      verification_month text,
      verification_year text,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS form5_library_membership (
      admission_record_id uuid PRIMARY KEY REFERENCES admission_record(id) ON DELETE CASCADE,
      name_surname text,
      name_first text,
      name_father text,
      branch_dept text,
      year_level text,
      diploma_fy_dsy text,
      permanent_address text,
      permanent_city text,
      permanent_pin text,
      local_address text,
      local_city text,
      local_pin text,
      email text,
      date_of_birth date,
      gender text,
      blood_group text,
      student_mobile_no text,
      parents_tel_no text,
      cast_category text,
      admission_receipt_no text,
      admission_date date,
      library_agreed boolean NOT NULL DEFAULT false,
      library_membership_no text,
      library_remark text,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS document_upload (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      admission_record_id uuid NOT NULL REFERENCES admission_record(id) ON DELETE CASCADE,
      checklist_item_id uuid REFERENCES checklist_item(id),
      file_ref text,
      file_name text,
      file_type text,
      upload_method text,
      status doc_status_enum NOT NULL DEFAULT 'NOT_UPLOADED',
      system_check_passed boolean,
      system_check_notes text,
      received_yn boolean,
      verified_by_id uuid REFERENCES app_user(id),
      verified_at timestamptz,
      reject_reason text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS fee_record (
      admission_record_id uuid PRIMARY KEY REFERENCES admission_record(id) ON DELETE CASCADE,
      total_fee_amount numeric NOT NULL DEFAULT 0,
      amount_paid numeric NOT NULL DEFAULT 0,
      remaining_balance numeric GENERATED ALWAYS AS (total_fee_amount - amount_paid) STORED,
      mode_of_payment payment_mode_enum,
      fee_status fee_status_enum NOT NULL DEFAULT 'Unpaid',
      installment_enabled boolean NOT NULL DEFAULT false,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS fee_installment (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      fee_record_id uuid NOT NULL REFERENCES fee_record(admission_record_id) ON DELETE CASCADE,
      installment_no int NOT NULL,
      amount numeric NOT NULL,
      mode_of_payment payment_mode_enum,
      date date,
      remaining_after numeric,
      voided boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS print_log (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      admission_record_id uuid NOT NULL REFERENCES admission_record(id) ON DELETE CASCADE,
      printed_by_id uuid REFERENCES app_user(id),
      printed_at timestamptz NOT NULL DEFAULT now(),
      version int NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS verification_log (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      admission_record_id uuid NOT NULL REFERENCES admission_record(id) ON DELETE CASCADE,
      action verification_action_enum NOT NULL,
      performed_by_id uuid REFERENCES app_user(id),
      performed_at timestamptz NOT NULL DEFAULT now(),
      password_confirmed boolean NOT NULL DEFAULT false,
      notes text
    );

    CREATE TABLE IF NOT EXISTS admitted_student (
      admission_record_id uuid PRIMARY KEY REFERENCES admission_record(id),
      snapshot jsonb NOT NULL,
      admitted_at timestamptz NOT NULL DEFAULT now()
    );

    DO $$ BEGIN
      CREATE TYPE cap_batch_status AS ENUM ('processing','success','failed');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE cap_variant AS ENUM ('GENERAL','EWS','TFWS');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE cap_score_type AS ENUM ('MHT_CET','JEE_MAIN');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE cap_gender AS ENUM ('M','F','O');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE TABLE IF NOT EXISTS cap_institute (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code text UNIQUE NOT NULL,
      name text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cap_upload_batch (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      institute_id uuid NOT NULL REFERENCES cap_institute(id),
      round_label text NOT NULL,
      published_on date,
      source_filename text NOT NULL,
      status cap_batch_status NOT NULL DEFAULT 'processing',
      error_message text,
      uploaded_by_id uuid,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cap_department (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      institute_id uuid NOT NULL REFERENCES cap_institute(id),
      name text NOT NULL,
      UNIQUE(institute_id, name)
    );

    CREATE TABLE IF NOT EXISTS cap_choice_code (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      batch_id uuid NOT NULL REFERENCES cap_upload_batch(id) ON DELETE CASCADE,
      department_id uuid NOT NULL REFERENCES cap_department(id),
      code text NOT NULL,
      variant cap_variant NOT NULL DEFAULT 'GENERAL',
      status_label text,
      sanction_intake int NOT NULL DEFAULT 0,
      cap_seats int NOT NULL DEFAULT 0,
      ms_seats int NOT NULL DEFAULT 0,
      minority_seats int NOT NULL DEFAULT 0,
      ai_seats int NOT NULL DEFAULT 0,
      institute_seats int NOT NULL DEFAULT 0,
      filled_seats int NOT NULL DEFAULT 0,
      vacant_seats int NOT NULL DEFAULT 0,
      UNIQUE(batch_id, code)
    );

    CREATE TABLE IF NOT EXISTS cap_seat_pool (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      choice_code_id uuid NOT NULL REFERENCES cap_choice_code(id) ON DELETE CASCADE,
      label text NOT NULL,
      sort_order int NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cap_candidate (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      choice_code_id uuid NOT NULL REFERENCES cap_choice_code(id) ON DELETE CASCADE,
      seat_pool_id uuid REFERENCES cap_seat_pool(id),
      sr_no int NOT NULL,
      merit_no int,
      score numeric,
      score_type cap_score_type,
      application_id text,
      candidate_name text NOT NULL,
      gender cap_gender,
      category text,
      seat_type_code text,
      status_symbol char(1),
      status_label text,
      is_vacant boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    DO $$ BEGIN
      CREATE TYPE "AdmissionPhaseCategory" AS ENUM ('GENERAL','CAP_ROUND_1','CAP_ROUND_2','CAP_ROUND_3','CAP_ROUND_4','INSTITUTE_LEVEL');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE TABLE IF NOT EXISTS admission_phase (
      id text PRIMARY KEY,
      academic_year text NOT NULL,
      sr_no int NOT NULL,
      category "AdmissionPhaseCategory" NOT NULL,
      activity text NOT NULL,
      short_label text NOT NULL,
      first_date timestamptz NOT NULL,
      last_date timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(academic_year, sr_no)
    );

    CREATE TABLE IF NOT EXISTS doc_lib_eligibility_file (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id text NOT NULL DEFAULT 'default',
      department text NOT NULL,
      file_name text NOT NULL,
      file_url text NOT NULL,
      checksum text NOT NULL,
      uploaded_at timestamptz NOT NULL DEFAULT now(),
      uploaded_by text NOT NULL DEFAULT 'system'
    );

    CREATE TABLE IF NOT EXISTS doc_lib_access_log (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id text NOT NULL DEFAULT 'default',
      actor_id text NOT NULL,
      action text NOT NULL,
      target_file text,
      timestamp timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS academic_batch (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      academic_year text NOT NULL,
      admission_status text NOT NULL,
      branch_code text NOT NULL,
      working_excel_path text NOT NULL,
      next_free_row int NOT NULL DEFAULT 15,
      finalized_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(academic_year, branch_code, admission_status)
    );

    CREATE TABLE IF NOT EXISTS excel_sync_audit (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id uuid NOT NULL REFERENCES admission_record(id) ON DELETE CASCADE,
      batch_id uuid NOT NULL REFERENCES academic_batch(id),
      action text NOT NULL,
      detail jsonb NOT NULL,
      performed_by_id text NOT NULL,
      performed_at timestamptz NOT NULL DEFAULT now()
    );

    ALTER TABLE admission_record ADD COLUMN IF NOT EXISTS cap_candidate_id uuid;
    ALTER TABLE admission_record ADD COLUMN IF NOT EXISTS excel_row_number int;
    ALTER TABLE admission_record ADD COLUMN IF NOT EXISTS excel_synced_at timestamptz;
    ALTER TABLE admission_record ADD COLUMN IF NOT EXISTS sync_status text DEFAULT 'DRAFT';
    ALTER TABLE admission_record ADD COLUMN IF NOT EXISTS voter_registered_yn text;
    ALTER TABLE admission_record ADD COLUMN IF NOT EXISTS epic_card_yn text;
    ALTER TABLE admission_record ADD COLUMN IF NOT EXISTS epic_number text;
  `);
}

/**
 * Creates a pg.Pool-compatible wrapper around PGlite WASM Postgres engine
 * for Prisma @prisma/adapter-pg
 */
class PGlitePool {
  private db: PGlite;

  constructor(db: PGlite) {
    this.db = db;
  }

  async connect(): Promise<any> {
    await ensureInitialized(this.db);
    return {
      query: async (options: any, params?: any) => {
        const isString = typeof options === "string";
        const sqlText = isString ? options : options.text;
        const sqlParams = isString ? params : options.values;
        const res = await this.db.query(sqlText, sqlParams);

        let rows = res.rows;
        if (!isString && options.rowMode === "array") {
          rows = res.rows.map((r: any) => res.fields.map((f) => r[f.name]));
        }

        return {
          rows,
          fields: res.fields.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID })),
          rowCount: res.rows.length,
        };
      },
      release: () => {},
      on: () => {},
      removeListener: () => {},
    };
  }

  async query(options: any, params?: any, callback?: any): Promise<any> {
    if (typeof params === "function") {
      callback = params;
      params = undefined;
    }
    await ensureInitialized(this.db);
    const isString = typeof options === "string";
    const sqlText = isString ? options : options.text;
    const sqlParams = typeof options === "string" ? params : options.values;
    const res = await this.db.query(sqlText, sqlParams);

    let rows = res.rows;
    if (!isString && options.rowMode === "array") {
      rows = res.rows.map((r: any) => res.fields.map((f) => r[f.name]));
    }

    const result = {
      rows,
      fields: res.fields.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID })),
      rowCount: res.rows.length,
    };

    if (callback) {
      callback(null, result);
    }
    return result;
  }

  on() {
    return this;
  }
  removeListener() {
    return this;
  }
  async end() {
    return Promise.resolve();
  }
}

export function createPGlitePool() {
  const db = getPGlite();
  return new PGlitePool(db) as unknown as Pool;
}
