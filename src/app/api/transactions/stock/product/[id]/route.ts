import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    const stocks = await prisma.stock.findMany({
      where: { productId },
      select: { quantity: true, price: true },
    });

    const totalQty = stocks.reduce((sum, s) => sum + Number(s.quantity), 0);
    const avgPrice =
      stocks.length > 0
        ? stocks.reduce((sum, s) => sum + Number(s.price), 0) / stocks.length
        : 0;

    return NextResponse.json({ totalQty, avgPrice });
  } catch (error) {
    console.error("Error fetching product stock:", error);
    return NextResponse.json(
      { error: "Failed to fetch product stock" },
      { status: 500 }
    );
  }
}
