import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const buyerId = searchParams.get("buyerId");

    const where: Record<string, unknown> = {};
    if (buyerId) where.buyerId = parseInt(buyerId);

    const returns = await prisma.return.findMany({
      where,
      include: {
        buyer: { select: { name: true } },
        details: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { returnDate: "desc" },
    });

    const rows = returns.flatMap((r) =>
      r.details.map((d) => ({
        returnId: r.id,
        invoiceNo: r.invoiceNo,
        buyer: r.buyer.name,
        returnDate: r.returnDate,
        jobNo: r.jobNo,
        product: d.product.name,
        returnQuantity: Number(d.returnQuantity),
        issuePrice: Number(d.issuePrice),
        returnPrice: Number(d.returnPrice),
        freight: Number(d.freight),
        total: Number(r.total),
        remark: r.remark,
      }))
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Buyer return error:", error);
    return NextResponse.json(
      { error: "Failed to fetch buyer return report" },
      { status: 500 }
    );
  }
}
