import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const returnRecord = await prisma.return.findUnique({
      where: { id: parseInt(id) },
      include: {
        buyer: { select: { id: true, name: true } },
        details: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!returnRecord) {
      return NextResponse.json(
        { error: "Return not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(returnRecord);
  } catch (error) {
    console.error("Error fetching return:", error);
    return NextResponse.json(
      { error: "Failed to fetch return" },
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
    const returnId = parseInt(id);
    const body = await request.json();
    const { invoiceNo, buyerId, returnDate, total, vehicleNo, transport, freight, jobNo, remark, details } = body;

    if (!buyerId || !returnDate || !details?.length) {
      return NextResponse.json(
        { error: "Buyer, return date, and at least one detail line are required" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // 1. Remove stock entries previously added by this return
      await tx.stock.deleteMany({ where: { transactionId: returnId } });

      // 2. Delete old details
      await tx.returnDetail.deleteMany({ where: { returnId } });

      // 3. Update the return header
      await tx.return.update({
        where: { id: returnId },
        data: {
          invoiceNo: invoiceNo || null,
          buyerId: parseInt(buyerId),
          returnDate: new Date(returnDate),
          total: parseFloat(total) || 0,
          vehicleNo: vehicleNo || null,
          transport: transport || null,
          freight: parseFloat(freight) || 0,
          jobNo: jobNo || null,
          remark: remark || null,
        },
      });

      // 4. Re-create details and add stock back
      for (const d of details) {
        await tx.returnDetail.create({
          data: {
            returnId,
            productId: parseInt(String(d.productId)),
            returnQuantity: parseFloat(String(d.returnQuantity)),
            issuePrice: parseFloat(String(d.issuePrice)) || 0,
            returnPrice: parseFloat(String(d.returnPrice)) || 0,
            freight: parseFloat(String(d.freight)) || 0,
            issueDetailId: d.issueDetailId ? parseInt(String(d.issueDetailId)) : null,
            issueId: d.issueId ? parseInt(String(d.issueId)) : null,
          },
        });

        await tx.stock.create({
          data: {
            productId: parseInt(String(d.productId)),
            quantity: parseFloat(String(d.returnQuantity)),
            price: parseFloat(String(d.returnPrice)) || 0,
            addedDate: new Date(returnDate),
            transactionId: returnId,
          },
        });
      }
    });

    const updated = await prisma.return.findUnique({
      where: { id: returnId },
      include: {
        buyer: { select: { id: true, name: true } },
        details: { include: { product: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating return:", error);
    return NextResponse.json({ error: "Failed to update return" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const returnId = parseInt(id);

    // Guard: block delete if stock added by this return has been re-issued
    const returnStocks = await prisma.stock.findMany({
      where: { transactionId: returnId },
      select: { id: true },
    });
    const stockIds = returnStocks.map((s) => s.id);
    if (stockIds.length > 0) {
      const issuedRecords = await prisma.issueStockRecord.findMany({
        where: { stockId: { in: stockIds } },
        select: { issueId: true },
      });
      if (issuedRecords.length > 0) {
        const issueIds = [...new Set(issuedRecords.map((r) => r.issueId))].sort((a, b) => a - b);
        return NextResponse.json(
          {
            error: `This return is locked and cannot be deleted.\n\nItems from this return have been re-issued in Issue #${issueIds.join(", #")}.\n\nPlease delete those issues first.`,
            locked: true,
          },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      // Find the return details to remove stock entries
      const returnRecord = await tx.return.findUnique({
        where: { id: returnId },
        include: { details: true },
      });

      if (!returnRecord) {
        throw new Error("Return not found");
      }

      // Remove stock entries that were added by this return
      // Stock entries added by returns have transactionId = returnRecord.id
      await tx.stock.deleteMany({
        where: { transactionId: returnId },
      });

      // Delete the return (cascade deletes details)
      await tx.return.delete({ where: { id: returnId } });
    });

    return NextResponse.json({ message: "Return deleted successfully" });
  } catch (error) {
    console.error("Error deleting return:", error);
    return NextResponse.json(
      { error: "Failed to delete return" },
      { status: 500 }
    );
  }
}
