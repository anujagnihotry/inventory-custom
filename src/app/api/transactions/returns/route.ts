import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const returns = await prisma.return.findMany({
      include: {
        buyer: { select: { id: true, name: true } },
      },
      orderBy: { returnDate: "desc" },
    });

    return NextResponse.json(returns);
  } catch (error) {
    console.error("Error fetching returns:", error);
    return NextResponse.json(
      { error: "Failed to fetch returns" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      invoiceNo,
      buyerId,
      returnDate,
      total,
      vehicleNo,
      transport,
      freight,
      jobNo,
      remark,
      details,
    } = body;

    if (!buyerId || !returnDate || !details?.length) {
      return NextResponse.json(
        { error: "Buyer, return date, and at least one detail line are required" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create the return with details
      const returnRecord = await tx.return.create({
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
          details: {
            create: details.map(
              (d: {
                productId: number;
                returnQuantity: number;
                issuePrice: number;
                returnPrice: number;
                freight: number;
                issueDetailId?: number;
                issueId?: number;
              }) => ({
                productId: parseInt(String(d.productId)),
                returnQuantity: parseFloat(String(d.returnQuantity)),
                issuePrice: parseFloat(String(d.issuePrice)) || 0,
                returnPrice: parseFloat(String(d.returnPrice)) || 0,
                freight: parseFloat(String(d.freight)) || 0,
                issueDetailId: d.issueDetailId
                  ? parseInt(String(d.issueDetailId))
                  : null,
                issueId: d.issueId ? parseInt(String(d.issueId)) : null,
              })
            ),
          },
        },
        include: { details: true },
      });

      // Add back to stock for each returned product
      for (const detail of returnRecord.details) {
        await tx.stock.create({
          data: {
            productId: detail.productId,
            quantity: Number(detail.returnQuantity),
            price: Number(detail.returnPrice),
            addedDate: new Date(returnDate),
            transactionId: returnRecord.id,
          },
        });
      }

      return returnRecord;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating return:", error);
    return NextResponse.json(
      { error: "Failed to create return" },
      { status: 500 }
    );
  }
}
