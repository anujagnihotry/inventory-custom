import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stock = await prisma.stock.findUnique({
      where: { id: parseInt(id) },
      include: { product: { select: { id: true, name: true } } },
    });
    if (!stock || stock.transactionId !== 0) {
      return NextResponse.json({ error: "Stock entry not found" }, { status: 404 });
    }
    return NextResponse.json(stock);
  } catch (error) {
    console.error("Error fetching stock entry:", error);
    return NextResponse.json({ error: "Failed to fetch stock entry" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stockId = parseInt(id);
    const body = await request.json();
    const { quantity, price, addedDate } = body;

    if (!quantity || !price || !addedDate) {
      return NextResponse.json({ error: "Quantity, price and date are required" }, { status: 400 });
    }

    const newQty = Number(quantity);

    // How much has been issued from this stock row?
    const issuedAgg = await prisma.issueStockRecord.aggregate({
      where: { stockId },
      _sum: { quantity: true },
    });
    const issuedQty = Number(issuedAgg._sum.quantity ?? 0);

    if (newQty < issuedQty) {
      return NextResponse.json(
        { error: `Cannot reduce quantity below issued amount. Already issued: ${issuedQty}` },
        { status: 400 }
      );
    }

    const updated = await prisma.stock.update({
      where: { id: stockId },
      data: {
        quantity: newQty - issuedQty, // remaining = new total - already issued
        price: Number(price),
        addedDate: new Date(addedDate),
      },
      include: { product: { select: { id: true, name: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating stock entry:", error);
    return NextResponse.json({ error: "Failed to update stock entry" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stockId = parseInt(id);

    // Guard: check if any issues have been raised against this stock row
    const issuedCount = await prisma.issueStockRecord.count({ where: { stockId } });
    if (issuedCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete — this stock entry has already been partially or fully issued. Please delete the related issues first." },
        { status: 400 }
      );
    }

    await prisma.stock.delete({ where: { id: stockId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting stock entry:", error);
    return NextResponse.json({ error: "Failed to delete stock entry" }, { status: 500 });
  }
}
