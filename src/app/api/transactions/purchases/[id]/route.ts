import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const purchase = await prisma.purchase.findUnique({
      where: { id: Number(id) },
      include: {
        supplier: { select: { id: true, name: true } },
        details: {
          include: {
            product: { select: { id: true, name: true } },
            unit: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(purchase);
  } catch (error) {
    console.error("Error fetching purchase:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase" },
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
    const purchaseId = Number(id);
    const body = await request.json();
    const {
      invoiceNo,
      supplierId,
      date,
      total,
      gst,
      netAmount,
      vehicleNo,
      transport,
      receivingDate,
      details,
    } = body;

    if (!invoiceNo || !supplierId || !date || !details || details.length === 0) {
      return NextResponse.json(
        { error: "Invoice No, Supplier, Date, and at least one detail line are required" },
        { status: 400 }
      );
    }

    // Guard: block edit if any stock from this purchase has been issued or scrapped
    const purchaseStocks = await prisma.stock.findMany({
      where: { purchaseId },
      select: { id: true },
    });
    const stockIds = purchaseStocks.map((s) => s.id);
    if (stockIds.length > 0) {
      const [issuedCount, scrappedCount] = await Promise.all([
        prisma.issueStockRecord.count({ where: { stockId: { in: stockIds } } }),
        prisma.scrapFromStock.count({ where: { stockId: { in: stockIds } } }),
      ]);
      if (issuedCount > 0 || scrappedCount > 0) {
        return NextResponse.json(
          { error: "Cannot edit this purchase — some items have already been issued or scrapped. Please delete or edit the related transactions first." },
          { status: 400 }
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Delete old stock entries related to this purchase
      await tx.stock.deleteMany({
        where: { purchaseId },
      });

      // Delete old purchase details
      await tx.purchaseDetail.deleteMany({
        where: { purchaseId },
      });

      // Update the purchase header
      const purchase = await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          invoiceNo,
          supplierId: Number(supplierId),
          date: new Date(date),
          total: total || 0,
          gst: gst || 0,
          netAmount: netAmount || 0,
          vehicleNo: vehicleNo || null,
          transport: transport || null,
          receivingDate: receivingDate ? new Date(receivingDate) : null,
        },
      });

      // Re-create purchase details and stock entries
      for (const detail of details) {
        await tx.purchaseDetail.create({
          data: {
            purchaseId: purchase.id,
            productId: Number(detail.productId),
            unitId: detail.unitId ? Number(detail.unitId) : null,
            hsn: detail.hsn || null,
            gst: detail.gst || 0,
            quantity: detail.quantity,
            price: detail.price,
            freight: detail.freight || 0,
            total: detail.total,
          },
        });

        await tx.stock.create({
          data: {
            purchaseId: purchase.id,
            productId: Number(detail.productId),
            quantity: detail.quantity,
            price: Number(detail.price) + Number(detail.freight || 0),
            addedDate: new Date(date),
            transactionId: 1,
          },
        });
      }

      return purchase;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating purchase:", error);
    return NextResponse.json(
      { error: "Failed to update purchase" },
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
    const purchaseId = Number(id);

    // Guard: check if any stock rows from this purchase have been issued
    const purchaseStocks = await prisma.stock.findMany({
      where: { purchaseId },
      select: { id: true },
    });
    const stockIds = purchaseStocks.map((s) => s.id);
    if (stockIds.length > 0) {
      const issuedCount = await prisma.issueStockRecord.count({
        where: { stockId: { in: stockIds } },
      });
      if (issuedCount > 0) {
        return NextResponse.json(
          { error: "Cannot delete this purchase — some items have already been issued. Please delete or edit the related issues first." },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      // Delete related stock entries
      await tx.stock.deleteMany({ where: { purchaseId } });
      // Delete purchase (details cascade via onDelete: Cascade)
      await tx.purchase.delete({ where: { id: purchaseId } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting purchase:", error);
    return NextResponse.json(
      { error: "Failed to delete purchase" },
      { status: 500 }
    );
  }
}
