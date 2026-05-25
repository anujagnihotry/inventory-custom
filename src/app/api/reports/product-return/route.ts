import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    const where: Record<string, unknown> = {};
    if (productId) where.productId = parseInt(productId);

    const returnDetails = await prisma.returnDetail.findMany({
      where,
      include: {
        product: { select: { name: true } },
        return: {
          include: {
            buyer: { select: { name: true } },
          },
        },
      },
      orderBy: { return: { returnDate: "desc" } },
    });

    const rows = returnDetails.map((d) => ({
      returnId: d.returnId,
      invoiceNo: d.return.invoiceNo,
      buyer: d.return.buyer.name,
      returnDate: d.return.returnDate,
      jobNo: d.return.jobNo,
      product: d.product.name,
      returnQuantity: Number(d.returnQuantity),
      issuePrice: Number(d.issuePrice),
      returnPrice: Number(d.returnPrice),
      freight: Number(d.freight),
      total: Number(d.returnQuantity) * Number(d.returnPrice),
    }));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Product return error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product return report" },
      { status: 500 }
    );
  }
}
