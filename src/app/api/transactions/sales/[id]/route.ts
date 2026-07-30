import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(id) },
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

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error fetching sale:", error);
    return NextResponse.json(
      { error: "Failed to fetch sale" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const saleId = parseInt(id);
    const body = await request.json();
    const { date, consigneeId, buyerId, total, roundOff, vehicleNo, transport, freight, remark, jobNo, details } = body;

    await prisma.$transaction(async (tx) => {
      // Delete existing details
      await tx.saleDetail.deleteMany({ where: { saleId } });

      // Update the sale header
      await tx.sale.update({
        where: { id: saleId },
        data: {
          date: new Date(date),
          consigneeId: parseInt(consigneeId),
          buyerId: parseInt(buyerId),
          total: total.toString(),
          roundOff: parseFloat(roundOff) || 0,
          vehicleNo: vehicleNo || null,
          transport: transport || null,
          freight: freight?.toString() || "0",
          remark: remark || null,
          jobNo: jobNo || null,
        },
      });

      // Re-create details
      for (const detail of details) {
        const productId = parseInt(detail.productId);
        const qty = parseFloat(detail.quantity);

        await tx.saleDetail.create({
          data: {
            saleId,
            productId,
            quantity: qty.toString(),
            price: detail.price?.toString() || "0",
            freight: detail.freight?.toString() || "0",
            total: detail.total?.toString() || "0",
            salePrice: detail.salePrice?.toString() || "0",
            remark: detail.remark || null,
            hsn: detail.hsn || null,
            gst: detail.gst || 0,
          },
        });
      }
    });

    const updated = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        buyer: { select: { id: true, name: true } },
        consignee: { select: { id: true, name: true } },
        details: { include: { product: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating sale:", error);
    return NextResponse.json({ error: "Failed to update sale" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const saleId = parseInt(id);

    await prisma.sale.delete({ where: { id: saleId } });

    return NextResponse.json({ message: "Sale deleted successfully" });
  } catch (error) {
    console.error("Error deleting sale:", error);
    return NextResponse.json(
      { error: "Failed to delete sale" },
      { status: 500 }
    );
  }
}
