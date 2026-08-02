import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { istStartOfDay, istEndOfDay } from "./seed-helpers";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const admissionPhases2026_27 = [
  // ── General ────────────────────────────────────────────────
  { srNo: 1, category: "GENERAL", activity: "Online registration of application and uploading of required documents by the Candidate for admission on website", shortLabel: "Online Registration", first: "2026-07-02", last: "2026-07-19" },
  { srNo: 2, category: "GENERAL", activity: "Documents verification and confirmation of Application Form for Admission by online mode", shortLabel: "Document Verification", first: "2026-07-03", last: "2026-07-20" },
  { srNo: 3, category: "GENERAL", activity: "Display of the provisional merit list", shortLabel: "Provisional Merit List", first: "2026-07-22", last: null },
  { srNo: 4, category: "GENERAL", activity: "Submission of grievances if any", shortLabel: "Grievance Submission", first: "2026-07-23", last: "2026-07-25" },
  { srNo: 5, category: "GENERAL", activity: "Display of the Final Merit lists", shortLabel: "Final Merit List", first: "2026-07-27", last: null },
  { srNo: 6, category: "GENERAL", activity: "Display of Provisional Category wise Seats (Seat Matrix) for CAP Round I", shortLabel: "Seat Matrix – CAP Round I", first: "2026-07-27", last: null },

  // ── CAP Round I ────────────────────────────────────────────
  { srNo: 7, category: "CAP_ROUND_1", activity: "Online Submission & Confirmation of Option Form of CAP Round-I", shortLabel: "CAP I – Option Form Filling", first: "2026-07-28", last: "2026-07-30" },
  { srNo: 8, category: "CAP_ROUND_1", activity: "Display of Provisional Allotment of CAP Round-I", shortLabel: "CAP I – Provisional Allotment", first: "2026-08-02", last: null },
  { srNo: 9, category: "CAP_ROUND_1", activity: "Reporting to the Allotted Institute and Confirmation of Admission", shortLabel: "CAP I – Reporting & Confirmation", first: "2026-08-03", last: "2026-08-05" },

  // ── CAP Round II ───────────────────────────────────────────
  { srNo: 10, category: "CAP_ROUND_2", activity: "Display of Provisional Vacant Seats for CAP Round II", shortLabel: "CAP II – Vacant Seats", first: "2026-08-06", last: null },
  { srNo: 11, category: "CAP_ROUND_2", activity: "Online Submission & Confirmation of Option Form of CAP Round-II", shortLabel: "CAP II – Option Form Filling", first: "2026-08-07", last: "2026-08-09" },
  { srNo: 12, category: "CAP_ROUND_2", activity: "Display of Provisional Allotment of CAP Round-II", shortLabel: "CAP II – Provisional Allotment", first: "2026-08-12", last: null },
  { srNo: 13, category: "CAP_ROUND_2", activity: "Reporting to the Allotted Institute and Confirmation of Admission", shortLabel: "CAP II – Reporting & Confirmation", first: "2026-08-13", last: "2026-08-17" },

  // ── CAP Round III ──────────────────────────────────────────
  { srNo: 14, category: "CAP_ROUND_3", activity: "Display of Provisional Vacant Seats for CAP Round III", shortLabel: "CAP III – Vacant Seats", first: "2026-08-18", last: null },
  { srNo: 15, category: "CAP_ROUND_3", activity: "Online Submission & Confirmation of Option Form of CAP Round-III", shortLabel: "CAP III – Option Form Filling", first: "2026-08-19", last: "2026-08-21" },
  { srNo: 16, category: "CAP_ROUND_3", activity: "Display of Provisional Allotment of CAP Round-III", shortLabel: "CAP III – Provisional Allotment", first: "2026-08-24", last: null },
  { srNo: 17, category: "CAP_ROUND_3", activity: "Reporting to the Allotted Institute and Confirmation of Admission", shortLabel: "CAP III – Reporting & Confirmation", first: "2026-08-25", last: "2026-08-27" },

  // ── CAP Round IV ───────────────────────────────────────────
  { srNo: 18, category: "CAP_ROUND_4", activity: "Display of Provisional Vacant Seats for CAP Round IV", shortLabel: "CAP IV – Vacant Seats", first: "2026-08-28", last: null },
  { srNo: 19, category: "CAP_ROUND_4", activity: "Online Submission & Confirmation of Option Form of CAP Round-IV", shortLabel: "CAP IV – Option Form Filling", first: "2026-08-29", last: "2026-08-31" },
  { srNo: 20, category: "CAP_ROUND_4", activity: "Display of Provisional Allotment of CAP Round-IV", shortLabel: "CAP IV – Provisional Allotment", first: "2026-09-03", last: null },
  { srNo: 21, category: "CAP_ROUND_4", activity: "Reporting to the Allotted Institute and Confirmation of Admission", shortLabel: "CAP IV – Reporting & Confirmation", first: "2026-09-04", last: "2026-09-07" },

  // ── Institute Level Option Form ────────────────────────────
  { srNo: 22, category: "INSTITUTE_LEVEL", activity: "Online submission of Option Form for Institute Level admissions", shortLabel: "Institute Level – Option Form", first: "2026-08-03", last: "2026-09-07" },
  { srNo: 23, category: "INSTITUTE_LEVEL", activity: "Transfer of institute wise candidate list to the respective institute", shortLabel: "Candidate List Transfer", first: "2026-09-08", last: null },
  { srNo: 24, category: "INSTITUTE_LEVEL", activity: "Institute Quota and Vacant seats after CAP, Complete Admission Process by following Government Admission Rules", shortLabel: "Institute Quota Admissions", first: "2026-09-08", last: "2026-09-15" },
  { srNo: 25, category: "INSTITUTE_LEVEL", activity: "Last date for cancellation of seat with full fees refund", shortLabel: "Seat Cancellation (Full Refund) Deadline", first: "2026-09-13", last: null },
  { srNo: 26, category: "INSTITUTE_LEVEL", activity: "Cut-off Date for all type of admissions for the Academic Year 2026-27", shortLabel: "Admissions Cut-off Date", first: "2026-09-15", last: null },
  { srNo: 27, category: "INSTITUTE_LEVEL", activity: "For Institutes: Last date of uploading the data", shortLabel: "Institute Data Upload Deadline", first: "2026-09-15", last: null },
] as const;

async function seedAdmissionPhases() {
  for (const row of admissionPhases2026_27) {
    await prisma.admissionPhase.upsert({
      where: { academicYear_srNo: { academicYear: "2026-27", srNo: row.srNo } },
      update: {
        category: row.category as any,
        activity: row.activity,
        shortLabel: row.shortLabel,
        firstDate: istStartOfDay(row.first),
        lastDate: row.last ? istEndOfDay(row.last) : null,
      },
      create: {
        academicYear: "2026-27",
        srNo: row.srNo,
        category: row.category as any,
        activity: row.activity,
        shortLabel: row.shortLabel,
        firstDate: istStartOfDay(row.first),
        lastDate: row.last ? istEndOfDay(row.last) : null,
      },
    });
  }
  console.log("Seeded 27 Admission Phases for 2026-27.");
}

async function seedPrincipal() {
  const passwordHash = await bcrypt.hash(process.env.PRINCIPAL_SEED_PASSWORD ?? "ChangeMe@123", 10);
  await prisma.appUser.upsert({
    where: { email: "principal@bscoer.edu.in" },
    update: { isActive: true },
    create: {
      name: "Principal",
      email: "principal@bscoer.edu.in",
      passwordHash,
      role: "PRINCIPAL" as any,
      isActive: true,
    },
  });
  console.log("Seeded Principal user account: principal@bscoer.edu.in");
}

async function main() {
  // Seed Institution if not exists
  const existingInst = await prisma.institution.findFirst();
  let institution = existingInst;
  if (!institution) {
    institution = await prisma.institution.create({
      data: {
        name: "TSSM's Bhivarabai Sawant College of Engineering & Research",
        address: "Narhe, Pune, Maharashtra",
        phone: "020-24301234",
        website: "https://bscoer.edu.in",
      },
    });
  }

  const adminPasswordHash = await bcrypt.hash("Admin@Scholaris2025", 12);

  const users = [
    { name: "Scholaris Admin", email: "admin@scholaris.edu", role: "SystemAdmin" },
    { name: "Front Desk Admin", email: "frontdesk@bscoer.edu.in", role: "FrontDesk" },
    { name: "Verification Admin", email: "verification@bscoer.edu.in", role: "VerificationAdmin" },
    { name: "Higher Authority", email: "hod@bscoer.edu.in", role: "HigherAuthority" },
    { name: "System Admin", email: "admin@bscoer.edu.in", role: "SystemAdmin" },
  ] as const;

  for (const u of users) {
    await prisma.appUser.upsert({
      where: { email: u.email },
      update: { passwordHash: adminPasswordHash },
      create: { name: u.name, email: u.email, passwordHash: adminPasswordHash, role: u.role as any },
    });
  }

  await seedPrincipal();
  await seedAdmissionPhases();

  console.log("Seed complete. Institution:", institution.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
