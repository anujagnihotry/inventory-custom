import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchases" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
      details,
    } = body;

    if (!invoiceNo || !supplierId || !date || !details || details.length === 0) {
      return NextResponse.json(
        { error: "Invoice No, Supplier, Date, and at least one detail line are required" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create the purchase record
      const purchase = await tx.purchase.create({
        data: {
          invoiceNo,
          supplierId: Number(supplierId),
          date: new Date(date),
          total: total || 0,
          gst: gst || 0,
          netAmount: netAmount || 0,
          vehicleNo: vehicleNo || null,
          transport: transport || null,
        },
      });

      // Create purchase detail records and stock entries
      for (const detail of details) {
        await tx.purchaseDetail.create({
          data: {
            purchaseId: purchase.id,
            productId: Number(detail.productId),
            description: detail.description || null,
            hsn: detail.hsn || null,
            quantity: detail.quantity,
            price: detail.price,
            freight: detail.freight || 0,
            total: detail.total,
          },
        });

        // Create stock entry for each detail line
        await tx.stock.create({
          data: {
            purchaseId: purchase.id,
            productId: Number(detail.productId),
            quantity: detail.quantity,
            price: Number(detail.price) + Number(detail.freight || 0),
            addedDate: new Date(date),
            transactionId: 1, // 1 = purchase
          },
        });
      }

      return purchase;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { error: "Failed to create purchase" },
      { status: 500 }
    );
  }
}
