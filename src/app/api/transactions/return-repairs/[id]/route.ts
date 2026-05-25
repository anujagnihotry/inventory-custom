import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const returnRepair = await prisma.returnRepair.findUnique({
      where: { id: Number(id) },
      include: {
        buyer: { select: { id: true, name: true } },
        details: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!returnRepair) {
      return NextResponse.json({ error: "Return repair not found" }, { status: 404 });
    }

    return NextResponse.json(returnRepair);
  } catch (error) {
    console.error("Error fetching return repair:", error);
    return NextResponse.json(
      { error: "Failed to fetch return repair" },
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
    await prisma.returnRepair.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting return repair:", error);
    return NextResponse.json(
      { error: "Failed to delete return repair" },
      { status: 500 }
    );
  }
}
