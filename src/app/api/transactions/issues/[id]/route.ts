import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const issue = await prisma.issue.findUnique({
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

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    return NextResponse.json(issue);
  } catch (error) {
    console.error("Error fetching issue:", error);
    return NextResponse.json(
      { error: "Failed to fetch issue" },
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
    const issueId = parseInt(id);
    const body = await request.json();
    const { date, consigneeId, buyerId, total, vehicleNo, transport, freight, remark, jobNo, details } = body;

    // Guard: block edit if returns have been recorded against this issue
    const linkedReturns = await prisma.returnDetail.findMany({
      where: { issueId },
      select: { returnId: true },
    });
    if (linkedReturns.length > 0) {
      const returnIds = [...new Set(linkedReturns.map((r) => r.returnId))].sort((a, b) => a - b);
      return NextResponse.json(
        {
          error: `This issue is locked and cannot be edited.\n\nReturns have been recorded against it in Return #${returnIds.join(", #")}.\n\nPlease delete those returns first.`,
          locked: true,
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // 1. Restore stock from existing issue stock records
      const stockRecords = await tx.issueStockRecord.findMany({ where: { issueId } });
      for (const record of stockRecords) {
        await tx.stock.update({
          where: { id: record.stockId },
          data: { quantity: { increment: Number(record.quantity) } },
        });
      }

      // 2. Validate new quantities against restored stock (before deducting)
      for (const detail of details) {
        const available = await tx.stock.aggregate({
          where: { productId: parseInt(String(detail.productId)), quantity: { gt: 0 } },
          _sum: { quantity: true },
        });
        const availableQty = Number(available._sum.quantity ?? 0);
        if (Number(detail.quantity) > availableQty) {
          const product = await tx.productMaster.findUnique({
            where: { id: parseInt(String(detail.productId)) },
            select: { name: true },
          });
          throw new Error(`Insufficient stock for "${product?.name ?? "product"}". Available: ${availableQty}, Requested: ${detail.quantity}`);
        }
      }

      // 3. Delete existing details and stock records
      await tx.issueStockRecord.deleteMany({ where: { issueId } });
      await tx.issueDetail.deleteMany({ where: { issueId } });

      // 3. Update the issue header
      await tx.issue.update({
        where: { id: issueId },
        data: {
          date: new Date(date),
          consigneeId: parseInt(consigneeId),
          buyerId: parseInt(buyerId),
          total: total.toString(),
          vehicleNo: vehicleNo || null,
          transport: transport || null,
          freight: freight?.toString() || "0",
          remark: remark || null,
          jobNo: jobNo || null,
        },
      });

      // 4. Re-create details with new stock deductions
      for (const detail of details) {
        const productId = parseInt(detail.productId);
        const qty = parseFloat(detail.quantity);

        // Deduct from stock FIFO
        const stocks = await tx.stock.findMany({
          where: { productId, quantity: { gt: 0 } },
          orderBy: { id: "asc" },
        });

        let remaining = qty;
        for (const stock of stocks) {
          if (remaining <= 0) break;
          const deduct = Math.min(remaining, Number(stock.quantity));
          await tx.stock.update({
            where: { id: stock.id },
            data: { quantity: { decrement: deduct } },
          });
          await tx.issueStockRecord.create({
            data: { issueId, stockId: stock.id, quantity: deduct.toString() },
          });
          remaining -= deduct;
        }

        await tx.issueDetail.create({
          data: {
            issueId,
            productId,
            quantity: qty.toString(),
            price: detail.price?.toString() || "0",
            freight: detail.freight?.toString() || "0",
            total: detail.total?.toString() || "0",
            issuePrice: detail.issuePrice?.toString() || "0",
            remark: detail.remark || null,
            hsn: detail.hsn || null,
            gst: detail.gst || 0,
          },
        });
      }
    });

    const updated = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        buyer: { select: { id: true, name: true } },
        consignee: { select: { id: true, name: true } },
        details: { include: { product: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating issue:", error);
    return NextResponse.json({ error: "Failed to update issue" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const issueId = parseInt(id);

    // Guard: block delete if returns have been recorded against this issue
    const linkedReturns = await prisma.returnDetail.findMany({
      where: { issueId },
      select: { returnId: true },
    });
    if (linkedReturns.length > 0) {
      const returnIds = [...new Set(linkedReturns.map((r) => r.returnId))].sort((a, b) => a - b);
      return NextResponse.json(
        {
          error: `This issue is locked and cannot be deleted.\n\nReturns have been recorded against it in Return #${returnIds.join(", #")}.\n\nPlease delete those returns first.`,
          locked: true,
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Restore stock from issue stock records
      const stockRecords = await tx.issueStockRecord.findMany({
        where: { issueId },
      });

      for (const record of stockRecords) {
        await tx.stock.update({
          where: { id: record.stockId },
          data: { quantity: { increment: Number(record.quantity) } },
        });
      }

      // Delete the issue (cascade deletes details and stock records)
      await tx.issue.delete({ where: { id: issueId } });
    });

    return NextResponse.json({ message: "Issue deleted successfully" });
  } catch (error) {
    console.error("Error deleting issue:", error);
    return NextResponse.json(
      { error: "Failed to delete issue" },
      { status: 500 }
    );
  }
}
