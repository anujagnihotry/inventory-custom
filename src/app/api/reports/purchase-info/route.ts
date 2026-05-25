import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId");

    const where: Record<string, unknown> = {};
    if (supplierId) {
      where.supplierId = parseInt(supplierId);
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
        details: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const rows = purchases.map((p) => ({
      id: p.id,
      invoiceNo: p.invoiceNo,
      supplier: p.supplier.name,
      date: p.date,
      total: Number(p.total),
      gst: Number(p.gst),
      netAmount: Number(p.netAmount),
      vehicleNo: p.vehicleNo,
      transport: p.transport,
      details: p.details.map((d) => ({
        product: d.product.name,
        description: d.description,
        hsn: d.hsn,
        quantity: Number(d.quantity),
        price: Number(d.price),
        freight: Number(d.freight),
        total: Number(d.total),
      })),
    }));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Purchase info error:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase info" },
      { status: 500 }
    );
  }
}
