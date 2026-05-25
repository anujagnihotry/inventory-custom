import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    const pid = parseInt(productId);

    const [product, purchaseDetails, issueDetails, returnDetails] =
      await Promise.all([
        prisma.productMaster.findUnique({
          where: { id: pid },
          include: {
            category: { select: { name: true } },
            unit: { select: { name: true } },
          },
        }),
        prisma.purchaseDetail.findMany({
          where: { productId: pid },
          include: {
            purchase: {
              include: { supplier: { select: { name: true } } },
            },
          },
          orderBy: { purchase: { date: "desc" } },
        }),
        prisma.issueDetail.findMany({
          where: { productId: pid },
          include: {
            issue: {
              include: {
                buyer: { select: { name: true } },
                consignee: { select: { name: true } },
              },
            },
          },
          orderBy: { issue: { date: "desc" } },
        }),
        prisma.returnDetail.findMany({
          where: { productId: pid },
          include: {
            return: {
              include: { buyer: { select: { name: true } } },
            },
          },
          orderBy: { return: { returnDate: "desc" } },
        }),
      ]);

    const movements: Record<string, unknown>[] = [];

    for (const pd of purchaseDetails) {
      movements.push({
        type: "Purchase",
        date: pd.purchase.date,
        party: pd.purchase.supplier.name,
        quantity: Number(pd.quantity),
        price: Number(pd.price),
        total: Number(pd.total),
        reference: `Invoice: ${pd.purchase.invoiceNo}`,
      });
    }

    for (const id of issueDetails) {
      movements.push({
        type: "Issue",
        date: id.issue.date,
        party: `${id.issue.buyer.name} / ${id.issue.consignee.name}`,
        quantity: -Number(id.quantity),
        price: Number(id.price),
        total: Number(id.total),
        reference: `Job: ${id.issue.jobNo || "N/A"}`,
      });
    }

    for (const rd of returnDetails) {
      movements.push({
        type: "Return",
        date: rd.return.returnDate,
        party: rd.return.buyer.name,
        quantity: Number(rd.returnQuantity),
        price: Number(rd.returnPrice),
        total: Number(rd.returnQuantity) * Number(rd.returnPrice),
        reference: `Invoice: ${rd.return.invoiceNo || "N/A"}`,
      });
    }

    movements.sort(
      (a, b) =>
        new Date(b.date as string).getTime() -
        new Date(a.date as string).getTime()
    );

    return NextResponse.json({
      product: product
        ? {
            name: product.name,
            category: product.category.name,
            unit: product.unit.name,
          }
        : null,
      movements,
    });
  } catch (error) {
    console.error("Product tracking error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product tracking" },
      { status: 500 }
    );
  }
}
