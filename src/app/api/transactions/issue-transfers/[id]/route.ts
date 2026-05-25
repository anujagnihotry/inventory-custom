import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transfer = await prisma.issueTransfer.findUnique({
      where: { id: Number(id) },
      include: {
        buyer: { select: { id: true, name: true } },
        consignee: { select: { id: true, name: true } },
        details: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!transfer) {
      return NextResponse.json({ error: "Issue transfer not found" }, { status: 404 });
    }

    return NextResponse.json(transfer);
  } catch (error) {
    console.error("Error fetching issue transfer:", error);
    return NextResponse.json(
      { error: "Failed to fetch issue transfer" },
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
    await prisma.issueTransfer.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting issue transfer:", error);
    return NextResponse.json(
      { error: "Failed to delete issue transfer" },
      { status: 500 }
    );
  }
}
