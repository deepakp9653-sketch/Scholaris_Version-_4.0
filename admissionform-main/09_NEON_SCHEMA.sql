-- =========================================================================
-- Scholaris — Admission Module (Phase 1)
-- Neon Postgres DDL — derived from 04_SCHEMA.md, corrected per 07_RULES.md §9
-- Run via: psql "$DIRECT_URL" -f 09_NEON_SCHEMA.sql
-- (use DIRECT_URL, not the pooled DATABASE_URL, for DDL/migrations)
-- =========================================================================

-- ---------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid() + field encryption

-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------

CREATE TYPE admission_status AS ENUM (
  'DRAFT',
  'FORMS_COMPLETE',
  'DOCS_IN_PROGRESS',
  'DOCS_VERIFIED',
  'FEE_RECORDED',
  'READY_TO_PRINT',
  'PRINTED',
  'PENDING_FINAL_VERIFICATION',
  'ADMITTED',
  'ON_HOLD',
  'REJECTED'
);

CREATE TYPE gender_type AS ENUM ('Male', 'Female', 'Transgender');

-- Canonical category union — see 07_RULES.md §4
CREATE TYPE category_type AS ENUM (
  'Open','OBC','SBC','SEBC','EWS','DEF','PH','Other',
  'NT1','NT2','NT3','NT(B)','NT(C)','NT(D)','DT(A)','VJ',
  'SC','ST'
);

CREATE TYPE admission_quota_type AS ENUM ('CAP_CET_AIEEE','JK','MGMT','AGAINST_CAP');
CREATE TYPE office_branch_type AS ENUM ('Civil','Comp','ETC','IT','Mech','Elect');
CREATE TYPE course_year_type AS ENUM ('1st','2nd','3rd','4th','5th');
CREATE TYPE applicant_type_type AS ENUM ('Maharashtrian','Non-Maharashtrian');
CREATE TYPE disability_type AS ENUM ('P1','P2','P3','P4','OT');
CREATE TYPE diploma_fy_dsy_type AS ENUM ('FY','DSY');
CREATE TYPE library_year_level_type AS ENUM ('FE','SE','ME','PhD');

CREATE TYPE file_type_enum AS ENUM ('image','pdf');
CREATE TYPE upload_method_enum AS ENUM ('scan','drag_drop','browse');
CREATE TYPE doc_status_enum AS ENUM ('NOT_UPLOADED','UPLOADED_PENDING_REVIEW','VERIFIED','REJECTED_REUPLOAD');

CREATE TYPE payment_mode_enum AS ENUM ('Cash','UPI','Bank_to_Bank','RTGS','DD');
CREATE TYPE fee_status_enum AS ENUM ('Unpaid','Partially_Paid','Fully_Paid');

CREATE TYPE verification_action_enum AS ENUM (
  'FORMS_SAVE_PASSWORD','DOC_VERIFIED','FINAL_VERIFICATION_PASSWORD','STATUS_CHANGE','UNLOCK'
);

CREATE TYPE user_role_enum AS ENUM ('FrontDesk','VerificationAdmin','HigherAuthority','SystemAdmin');
CREATE TYPE admission_type_enum AS ENUM ('FE','DSE');

-- ---------------------------------------------------------------------
-- 2. Supporting tables
-- ---------------------------------------------------------------------

CREATE TABLE institution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  website text,
  crest_asset_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app_user (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role user_role_enum NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 3. AdmissionRecord (root entity)
-- ---------------------------------------------------------------------

CREATE TABLE admission_record (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status admission_status NOT NULL DEFAULT 'DRAFT',
  institution_id uuid NOT NULL REFERENCES institution(id),
  assigned_operator_id uuid REFERENCES app_user(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  hold_reason text,
  rejected_reason text
);

CREATE INDEX idx_admission_record_status ON admission_record(status);
CREATE INDEX idx_admission_record_institution ON admission_record(institution_id);

-- ---------------------------------------------------------------------
-- 4. StudentProfile — canonical shared fields (PRD §7), corrected per Rules §9
-- ---------------------------------------------------------------------

CREATE TABLE student_profile (
  admission_record_id uuid PRIMARY KEY REFERENCES admission_record(id) ON DELETE CASCADE,

  full_name_surname text,
  full_name_first text,
  full_name_father text,
  father_name text,
  mother_name text,
  date_of_birth date,
  gender gender_type,
  blood_group text,

  mobile_no text,
  contact_tel_no text,              -- [rules §9] general STD landline, Form 1 item 8
  parents_tel_no text,

  email text,
  religion_caste text,
  category category_type,

  branch_course text,
  admission_year_start int,
  admission_year_end int,
  admission_date date,              -- [rules §9] Library form item 14

  correspondence_address text,
  correspondence_pin text,
  correspondence_tel_no text,       -- [rules §9] Form 1 item 16

  permanent_address text,
  permanent_pin text,
  permanent_city text,              -- [rules §9] Library form item 5
  permanent_tel_no text,            -- [rules §9] Form 1 item 17

  aadhar_no_encrypted bytea,        -- pgcrypto pgp_sym_encrypt output, never plain text
  pan_no text,
  photo_file_ref text,
  admission_receipt_no text,

  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 5. Form1Application
-- ---------------------------------------------------------------------

CREATE TABLE form1_application (
  admission_record_id uuid PRIMARY KEY REFERENCES admission_record(id) ON DELETE CASCADE,

  admission_quota admission_quota_type,
  admission_category text,
  home_university text,
  mother_tongue text,

  ssc_marks_english_obtained numeric, ssc_marks_english_out_of numeric,
  ssc_marks_maths_obtained numeric,   ssc_marks_maths_out_of numeric,
  ssc_grand_total_obtained numeric,   ssc_grand_total_out_of numeric,
  ssc_percentage numeric,
  ssc_year_of_passing int,

  hsc_physics_obtained numeric,   hsc_physics_out_of numeric,
  hsc_chemistry_obtained numeric, hsc_chemistry_out_of numeric,
  hsc_maths_obtained numeric,     hsc_maths_out_of numeric,
  hsc_pcm_total_obtained numeric, hsc_pcm_total_out_of numeric,
  hsc_grand_total_obtained numeric, hsc_grand_total_out_of numeric,
  hsc_year_of_passing int,

  cet_physics_obtained numeric,   cet_physics_out_of numeric,
  cet_chemistry_obtained numeric, cet_chemistry_out_of numeric,
  cet_maths_obtained numeric,     cet_maths_out_of numeric,
  cet_pcm_total_obtained numeric, cet_pcm_total_out_of numeric,
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

  signature_student_ref text,
  signature_parent_ref text,

  office_use_eligible_for text,
  office_use_branch office_branch_type
);

-- ---------------------------------------------------------------------
-- 6. Form2DocumentChecklist + ChecklistItem (18 reference rows)
-- ---------------------------------------------------------------------

CREATE TABLE form2_document_checklist (
  admission_record_id uuid PRIMARY KEY REFERENCES admission_record(id) ON DELETE CASCADE,
  admission_type admission_type_enum,
  cap_id text,
  staff_sign_ref text,
  student_sign_ref text,
  checklist_date date
);

CREATE TABLE checklist_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form2_id uuid NOT NULL REFERENCES form2_document_checklist(admission_record_id) ON DELETE CASCADE,
  sr_no int NOT NULL,
  document_name text NOT NULL,
  required boolean NOT NULL DEFAULT false,
  UNIQUE(form2_id, sr_no)
);

-- Reference seed list (static — the 18 rows on the source form)
-- Insert per-record when a Form2DocumentChecklist row is created (application code),
-- using this canonical list:
--  1  Allotment Letter
--  2  Confirmation Letter
--  3  S.S.C. Mark sheet
--  4  S.S.C. Board Certificate
--  5  H.S.C. Mark sheet
--  6  H.S.C. Board Certificate
--  7  Leaving / TC Certificate
--  8  Migration Certificate (If Applicable)
--  9  Age, Nationality, Domicile / Birth Certificate
-- 10  Cast Certificate (If Applicable)
-- 11  Cast Validity Certificate (If Applicable)
-- 12  Non Creamy-layer (If Applicable)
-- 13  Income Certificate (If Applicable)
-- 14  EWS Certificate (If Applicable)
-- 15  Gap Certificate (If Applicable)
-- 16  Aadhar Card Xerox
-- 17  APAAR/ABC ID Xerox
-- 18  Passport Size 2 Photo

-- ---------------------------------------------------------------------
-- 7. Form3Eligibility
-- ---------------------------------------------------------------------

CREATE TABLE form3_eligibility (
  admission_record_id uuid PRIMARY KEY REFERENCES admission_record(id) ON DELETE CASCADE,

  course_name text,
  course_year course_year_type,
  applicant_type applicant_type_type,
  nationality text,
  religion text,

  category_tick category_type,
  belongs_to_reserved_yn boolean,

  physically_disabled_yn boolean,
  physically_disabled_type disability_type,

  qual_course_name text,
  qual_duration text,
  qual_university text,
  qual_college_dept text,
  qual_seat_no text,
  qual_month_year_passing text,
  qual_percentage numeric,
  qual_class_grade text,

  minority_yn boolean,
  minority_linguistic boolean,
  minority_religion boolean,

  signature_candidate_ref text,

  office_receipt_no text,
  office_date date,
  office_eligible_status text,
  office_asst text,
  office_sr_asst text,
  office_os_registrar_hod text
);

-- Repeatable educational-gap rows (schema doc notes: model as child table if >1 needed)
CREATE TABLE educational_gap (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_record_id uuid NOT NULL REFERENCES form3_eligibility(admission_record_id) ON DELETE CASCADE,
  last_exam_name text,
  seat_no text,
  month_year_passing text,
  percentage numeric,
  class_grade text
);

-- ---------------------------------------------------------------------
-- 8. Form4AntiRaggingAffidavit
-- ---------------------------------------------------------------------

CREATE TABLE form4_anti_ragging_affidavit (
  admission_record_id uuid PRIMARY KEY REFERENCES admission_record(id) ON DELETE CASCADE,
  full_name_with_enrollment_no text,
  son_daughter_of text,
  admitted_to_institution text,
  declared_day text, declared_month text, declared_year text,
  signature_deponent_ref text,
  verified_at_place text,
  verified_day text, verified_month text, verified_year text,
  signature_deponent_verification_ref text
  -- Oath Commissioner section intentionally has no digital fields (PRD §14.2)
);

-- ---------------------------------------------------------------------
-- 9. Form5LibraryMembership — corrected per Rules §9
-- ---------------------------------------------------------------------

CREATE TABLE form5_library_membership (
  admission_record_id uuid PRIMARY KEY REFERENCES admission_record(id) ON DELETE CASCADE,

  year_level library_year_level_type,
  diploma_fy_dsy diploma_fy_dsy_type,

  local_address text,
  local_city text,
  local_pin text,

  cast_category category_type,

  library_signature_ref text,
  date_field date,                          -- [rules §9] form-level Date
  admin_officer_accountant_sign_ref text,   -- [rules §9]

  library_membership_id_card_no text,
  remark text,
  librarian_sign_ref text,

  rules_agreed_yn boolean NOT NULL DEFAULT false,
  rules_agreed_at timestamptz
);

-- ---------------------------------------------------------------------
-- 10. DocumentUpload
-- ---------------------------------------------------------------------

CREATE TABLE document_upload (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_record_id uuid NOT NULL REFERENCES admission_record(id) ON DELETE CASCADE,
  checklist_item_id uuid NOT NULL REFERENCES checklist_item(id),
  file_ref text NOT NULL,             -- S3 object key
  file_type file_type_enum NOT NULL,
  upload_method upload_method_enum NOT NULL,
  status doc_status_enum NOT NULL DEFAULT 'NOT_UPLOADED',
  system_check_passed boolean,
  system_check_notes text,
  received_yn boolean,
  verified_by uuid REFERENCES app_user(id),
  verified_at timestamptz,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_upload_record ON document_upload(admission_record_id);
CREATE INDEX idx_document_upload_status ON document_upload(status);

-- ---------------------------------------------------------------------
-- 11. FeeRecord + Installment
-- ---------------------------------------------------------------------

CREATE TABLE fee_record (
  admission_record_id uuid PRIMARY KEY REFERENCES admission_record(id) ON DELETE CASCADE,
  total_fee_amount numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  remaining_balance numeric GENERATED ALWAYS AS (total_fee_amount - amount_paid) STORED,
  mode_of_payment payment_mode_enum,
  installment_enabled boolean NOT NULL DEFAULT false,
  fee_status fee_status_enum NOT NULL DEFAULT 'Unpaid'
);

CREATE TABLE installment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_record_id uuid NOT NULL REFERENCES fee_record(admission_record_id) ON DELETE CASCADE,
  installment_no int NOT NULL,
  amount numeric NOT NULL,
  mode_of_payment payment_mode_enum NOT NULL,
  date date NOT NULL,
  remaining_after numeric NOT NULL,
  voided boolean NOT NULL DEFAULT false,   -- per Rules §6: void, never delete
  UNIQUE(fee_record_id, installment_no)
);

-- ---------------------------------------------------------------------
-- 12. PrintLog / VerificationLog (append-only audit trail)
-- ---------------------------------------------------------------------

CREATE TABLE print_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_record_id uuid NOT NULL REFERENCES admission_record(id) ON DELETE CASCADE,
  printed_at timestamptz NOT NULL DEFAULT now(),
  printed_by uuid NOT NULL REFERENCES app_user(id),
  version int NOT NULL
);

CREATE TABLE verification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_record_id uuid NOT NULL REFERENCES admission_record(id) ON DELETE CASCADE,
  action verification_action_enum NOT NULL,
  actor_id uuid NOT NULL REFERENCES app_user(id),
  role_at_time text NOT NULL,
  password_confirmed boolean NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  notes text
);

-- Enforce append-only at the DB layer: revoke UPDATE/DELETE from the app role
-- (run once you've created a dedicated low-privilege app role — see step 14)

CREATE INDEX idx_verification_log_record ON verification_log(admission_record_id);

-- ---------------------------------------------------------------------
-- 13. AdmittedStudent — immutable snapshot, populated on ADMITTED transition
-- ---------------------------------------------------------------------

CREATE TABLE admitted_student (
  admission_record_id uuid PRIMARY KEY REFERENCES admission_record(id),
  snapshot jsonb NOT NULL,   -- denormalized copy of all forms + fee + doc summary
  admitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admitted_student_snapshot ON admitted_student USING gin (snapshot);

-- ---------------------------------------------------------------------
-- 14. (Recommended) Dedicated low-privilege app role — Rules §8
-- ---------------------------------------------------------------------
-- Run these manually with a superuser connection, substituting a real password,
-- then use THAT role's connection string as your app's DATABASE_URL/DIRECT_URL
-- instead of neondb_owner, so the app itself cannot DELETE/UPDATE verification_log.
--
-- CREATE ROLE scholaris_app WITH LOGIN PASSWORD 'choose-a-strong-password';
-- GRANT CONNECT ON DATABASE neondb TO scholaris_app;
-- GRANT USAGE ON SCHEMA public TO scholaris_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO scholaris_app;
-- REVOKE UPDATE, DELETE ON verification_log FROM scholaris_app;
-- GRANT SELECT, INSERT ON verification_log TO scholaris_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO scholaris_app;

-- =========================================================================
-- End of script
-- =========================================================================
