import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const challan = await prisma.purchaseChallan.findUnique({
      where: { id: Number(id) },
      include: {
        supplier: { select: { id: true, name: true } },
        details: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!challan) {
      return NextResponse.json({ error: "Purchase challan not found" }, { status: 404 });
    }

    return NextResponse.json(challan);
  } catch (error) {
    console.error("Error fetching purchase challan:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase challan" },
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
    await prisma.purchaseChallan.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting purchase challan:", error);
    return NextResponse.json(
      { error: "Failed to delete purchase challan" },
      { status: 500 }
    );
  }
}
