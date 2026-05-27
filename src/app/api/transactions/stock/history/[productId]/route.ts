import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface HistoryEntry {
  date: string;
  type: "Opening Stock" | "Purchase" | "Issue" | "Return";
  quantity: number;
  price: number;
  sign: "+" | "-";
  invoiceNo?: string | null;
  supplierName?: string | null;
  buyerName?: string | null;
  jobNo?: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const pid = parseInt(productId);

    if (isNaN(pid)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const timeline: HistoryEntry[] = [];

    // 1. Opening Stock entries (transactionId = 0)
    const openingStocks = await prisma.stock.findMany({
      where: { productId: pid, transactionId: 0 },
    });

    for (const stock of openingStocks) {
      // Original qty = current remaining + total issued from this stock row
      const issuedAgg = await prisma.issueStockRecord.aggregate({
        where: { stockId: stock.id },
        _sum: { quantity: true },
      });
      const issuedQty = Number(issuedAgg._sum.quantity ?? 0);
      const originalQty = Number(stock.quantity) + issuedQty;

      timeline.push({
        date: stock.addedDate.toISOString(),
        type: "Opening Stock",
        quantity: originalQty,
        price: Number(stock.price),
        sign: "+",
      });
    }

    // 2. Purchase entries
    const purchaseDetails = await prisma.purchaseDetail.findMany({
      where: { productId: pid },
      include: {
        purchase: {
          include: { supplier: { select: { name: true } } },
        },
      },
    });

    for (const detail of purchaseDetails) {
      timeline.push({
        date: detail.purchase.date.toISOString(),
        type: "Purchase",
        quantity: Number(detail.quantity),
        price: Number(detail.price),
        sign: "+",
        invoiceNo: detail.purchase.invoiceNo,
        supplierName: detail.purchase.supplier?.name ?? null,
      });
    }

    // 3. Issue entries
    const issueDetails = await prisma.issueDetail.findMany({
      where: { productId: pid },
      include: {
        issue: {
          include: { buyer: { select: { name: true } } },
        },
      },
    });

    for (const detail of issueDetails) {
      timeline.push({
        date: detail.issue.date.toISOString(),
        type: "Issue",
        quantity: Number(detail.quantity),
        price: Number(detail.issuePrice),
        sign: "-",
        buyerName: detail.issue.buyer?.name ?? null,
        jobNo: detail.issue.jobNo,
      });
    }

    // 4. Return entries
    const returnDetails = await prisma.returnDetail.findMany({
      where: { productId: pid },
      include: {
        return: {
          include: { buyer: { select: { name: true } } },
        },
      },
    });

    for (const detail of returnDetails) {
      timeline.push({
        date: detail.return.returnDate.toISOString(),
        type: "Return",
        quantity: Number(detail.returnQuantity),
        price: Number(detail.returnPrice),
        sign: "+",
        buyerName: detail.return.buyer?.name ?? null,
        jobNo: detail.return.jobNo,
      });
    }

    // Sort by date ascending, then by type order for same date
    const typeOrder = { "Opening Stock": 0, Purchase: 1, Return: 2, Issue: 3 };
    timeline.sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return typeOrder[a.type] - typeOrder[b.type];
    });

    return NextResponse.json(timeline);
  } catch (error) {
    console.error("Error fetching stock history:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock history" },
      { status: 500 }
    );
  }
}
