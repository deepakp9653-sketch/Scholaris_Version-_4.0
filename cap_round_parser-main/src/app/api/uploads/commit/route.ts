import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../../lib/auth';
import { getPreview, clearPreview } from '../../../../lib/parser/previewStore';
import prisma from '../../../../lib/db';
import { Variant, ScoreType, Gender } from '@prisma/client';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { previewId, action = 'append' } = body;

    if (!previewId) {
      return NextResponse.json({ error: "Missing previewId" }, { status: 400 });
    }

    const parsedData = getPreview(previewId);
    if (!parsedData) {
      return NextResponse.json({ error: "Preview session expired or not found. Please re-upload the PDF." }, { status: 404 });
    }

    // High-performance bulk commit in a single transaction with extended timeout
    const batchResult = await prisma.$transaction(async (tx) => {
      // 1. Upsert Institute
      const institute = await tx.institute.upsert({
        where: { code: parsedData.instituteCode },
        update: { name: parsedData.instituteName },
        create: {
          code: parsedData.instituteCode,
          name: parsedData.instituteName
        }
      });

      // 2. Fetch admin user
      const admin = await tx.admin.findUnique({
        where: { email: session.email }
      }) || await tx.admin.findFirstOrThrow();

      // 3. If action is replace, delete previous batch for this institute & round label
      if (action === 'replace') {
        const existingBatches = await tx.uploadBatch.findMany({
          where: {
            instituteId: institute.id,
            roundLabel: parsedData.roundLabel
          }
        });

        for (const eb of existingBatches) {
          await tx.uploadBatch.delete({ where: { id: eb.id } });
        }
      }

      // 4. Create UploadBatch
      const batchId = randomUUID();
      const batch = await tx.uploadBatch.create({
        data: {
          id: batchId,
          instituteId: institute.id,
          roundLabel: parsedData.roundLabel,
          publishedOn: parsedData.publishedOnDate ? new Date(parsedData.publishedOnDate) : new Date(),
          sourceFilename: parsedData.sourceFilename,
          status: 'success',
          uploadedBy: admin.id
        }
      });

      // 5. Pre-fetch & cache departments in-memory to eliminate per-iteration DB upsert calls
      const deptMap = new Map<string, string>();
      const existingDepts = await tx.department.findMany({
        where: { instituteId: institute.id }
      });
      existingDepts.forEach(d => deptMap.set(d.name, d.id));

      for (const ccData of parsedData.choiceCodes) {
        if (!deptMap.has(ccData.departmentName)) {
          const newDeptId = randomUUID();
          const newDept = await tx.department.create({
            data: {
              id: newDeptId,
              instituteId: institute.id,
              name: ccData.departmentName
            }
          });
          deptMap.set(newDept.name, newDept.id);
        }
      }

      const choiceCodeRecords: any[] = [];
      const seatPoolRecords: any[] = [];
      const candidateRecords: any[] = [];

      // 6. Build in-memory ID mapped graph
      for (const ccData of parsedData.choiceCodes) {
        const departmentId = deptMap.get(ccData.departmentName)!;
        const choiceCodeId = randomUUID();

        choiceCodeRecords.push({
          id: choiceCodeId,
          batchId: batch.id,
          departmentId: departmentId,
          code: ccData.code,
          variant: ccData.variant as Variant,
          statusLabel: ccData.statusLabel,
          sanctionIntake: ccData.sanctionIntake,
          capSeats: ccData.capSeats,
          msSeats: ccData.msSeats,
          minoritySeats: ccData.minoritySeats,
          aiSeats: ccData.aiSeats,
          instituteSeats: ccData.instituteSeats,
          filledSeats: ccData.filledSeats,
          vacantSeats: ccData.vacantSeats
        });

        for (const poolData of ccData.seatPools) {
          const seatPoolId = randomUUID();
          seatPoolRecords.push({
            id: seatPoolId,
            choiceCodeId: choiceCodeId,
            label: poolData.label,
            sortOrder: poolData.sortOrder
          });

          for (const c of poolData.candidates) {
            candidateRecords.push({
              id: randomUUID(),
              choiceCodeId: choiceCodeId,
              seatPoolId: seatPoolId,
              srNo: c.srNo,
              meritNo: c.meritNo,
              score: c.score,
              scoreType: c.scoreType ? (c.scoreType as ScoreType) : null,
              applicationId: c.applicationId,
              candidateName: c.candidateName,
              gender: c.gender ? (c.gender as Gender) : null,
              category: c.category,
              seatTypeCode: c.seatTypeCode,
              statusSymbol: c.statusSymbol,
              statusLabel: c.statusLabel,
              isVacant: c.isVacant
            });
          }
        }
      }

      // 7. Execute Bulk Inserts (3 fast queries total)
      if (choiceCodeRecords.length > 0) {
        await tx.choiceCode.createMany({ data: choiceCodeRecords });
      }

      if (seatPoolRecords.length > 0) {
        await tx.seatPool.createMany({ data: seatPoolRecords });
      }

      if (candidateRecords.length > 0) {
        await tx.candidate.createMany({ data: candidateRecords });
      }

      return batch;
    }, {
      maxWait: 20000,
      timeout: 120000
    });

    clearPreview(previewId);

    return NextResponse.json({
      success: true,
      batchId: batchResult.id,
      message: "CAP Allotment dataset successfully committed to database."
    });

  } catch (error: any) {
    console.error("Commit transaction error:", error);
    return NextResponse.json({ error: error.message || "Failed to commit parse batch to database" }, { status: 500 });
  }
}
