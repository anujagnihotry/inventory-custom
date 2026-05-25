import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scrap = await prisma.scrapFromGodown.findUnique({
      where: { id: Number(id) },
      include: {
        consignee: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        details: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!scrap) {
      return NextResponse.json({ error: "Scrap from godown not found" }, { status: 404 });
    }

    return NextResponse.json(scrap);
  } catch (error) {
    console.error("Error fetching scrap from godown:", error);
    return NextResponse.json(
      { error: "Failed to fetch scrap from godown" },
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
    await prisma.scrapFromGodown.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scrap from godown:", error);
    return NextResponse.json(
      { error: "Failed to delete scrap from godown" },
      { status: 500 }
    );
  }
}
