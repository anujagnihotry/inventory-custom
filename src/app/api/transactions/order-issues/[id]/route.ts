import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderIssue = await prisma.orderIssue.findUnique({
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

    if (!orderIssue) {
      return NextResponse.json({ error: "Order issue not found" }, { status: 404 });
    }

    return NextResponse.json(orderIssue);
  } catch (error) {
    console.error("Error fetching order issue:", error);
    return NextResponse.json(
      { error: "Failed to fetch order issue" },
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
    await prisma.orderIssue.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting order issue:", error);
    return NextResponse.json(
      { error: "Failed to delete order issue" },
      { status: 500 }
    );
  }
}
