import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const returnRecord = await prisma.return.findUnique({
      where: { id: parseInt(id) },
      include: {
        buyer: { select: { id: true, name: true } },
        details: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!returnRecord) {
      return NextResponse.json(
        { error: "Return not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(returnRecord);
  } catch (error) {
    console.error("Error fetching return:", error);
    return NextResponse.json(
      { error: "Failed to fetch return" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const returnId = parseInt(id);

    await prisma.$transaction(async (tx) => {
      // Find the return details to remove stock entries
      const returnRecord = await tx.return.findUnique({
        where: { id: returnId },
        include: { details: true },
      });

      if (!returnRecord) {
        throw new Error("Return not found");
      }

      // Remove stock entries that were added by this return
      // Stock entries added by returns have transactionId = returnRecord.id
      await tx.stock.deleteMany({
        where: { transactionId: returnId },
      });

      // Delete the return (cascade deletes details)
      await tx.return.delete({ where: { id: returnId } });
    });

    return NextResponse.json({ message: "Return deleted successfully" });
  } catch (error) {
    console.error("Error deleting return:", error);
    return NextResponse.json(
      { error: "Failed to delete return" },
      { status: 500 }
    );
  }
}
