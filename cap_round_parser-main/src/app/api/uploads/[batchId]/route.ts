import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../../lib/auth';
import prisma from '../../../../lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { batchId } = params;

    await prisma.uploadBatch.delete({
      where: { id: batchId }
    });

    return NextResponse.json({ success: true, message: `Batch ${batchId} deleted successfully.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete batch" }, { status: 500 });
  }
}
