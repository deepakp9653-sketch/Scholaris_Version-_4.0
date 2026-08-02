import { prisma } from "../src/lib/db/prisma";

async function main() {
  const records = await prisma.admissionRecord.findMany({
    include: {
      studentProfile: true,
    },
  });

  console.log(`Found ${records.length} records to delete.`);

  for (const record of records) {
    const id = record.id;
    console.log(`Deleting record ${id}...`);
    try { await prisma.verificationLog.deleteMany({ where: { admissionRecordId: id } }); } catch (e) {}
    try { await prisma.excelSyncAudit.deleteMany({ where: { studentId: id } }); } catch (e) {}
    try { await prisma.feeInstallment.deleteMany({ where: { feeRecord: { admissionRecordId: id } } }); } catch (e) {}
    try { await prisma.feeRecord.deleteMany({ where: { admissionRecordId: id } }); } catch (e) {}
    try { await prisma.documentUpload.deleteMany({ where: { admissionRecordId: id } }); } catch (e) {}
    try { await prisma.form1Application.deleteMany({ where: { admissionRecordId: id } }); } catch (e) {}
    try { await prisma.form2Checklist.deleteMany({ where: { admissionRecordId: id } }); } catch (e) {}
    try { await prisma.educationalGap.deleteMany({ where: { form3Eligibility: { admissionRecordId: id } } }); } catch (e) {}
    try { await prisma.form3Eligibility.deleteMany({ where: { admissionRecordId: id } }); } catch (e) {}
    try { await prisma.form4AntiRagging.deleteMany({ where: { admissionRecordId: id } }); } catch (e) {}
    try { await prisma.form5LibraryMembership.deleteMany({ where: { admissionRecordId: id } }); } catch (e) {}
    try { await prisma.studentProfile.deleteMany({ where: { admissionRecordId: id } }); } catch (e) {}
    try {
      await prisma.admissionRecord.delete({ where: { id } });
      console.log(`Successfully deleted record ${id}`);
    } catch (err) {
      console.error(`Failed to delete record ${id}:`, err);
    }
  }

  const remaining = await prisma.admissionRecord.count();
  console.log("Remaining admission records in DB:", remaining);
}

main().catch(console.error).finally(() => prisma.$disconnect());
