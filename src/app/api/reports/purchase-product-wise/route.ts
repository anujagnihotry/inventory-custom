import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};

    if (productId) {
      where.details = { some: { productId: parseInt(productId) } };
    }

    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);
      where.date = dateFilter;
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
        details: {
          where: productId ? { productId: parseInt(productId) } : undefined,
          include: {
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const rows = purchases.flatMap((p) =>
      p.details.map((d) => ({
        purchaseId: p.id,
        invoiceNo: p.invoiceNo,
        supplier: p.supplier.name,
        date: p.date,
        product: d.product.name,
        description: d.description,
        hsn: d.hsn,
        quantity: Number(d.quantity),
        price: Number(d.price),
        freight: Number(d.freight),
        total: Number(d.total),
      }))
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Purchase product-wise error:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase product-wise report" },
      { status: 500 }
    );
  }
}
