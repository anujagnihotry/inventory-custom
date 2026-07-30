import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        buyer: { select: { id: true, name: true } },
        consignee: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      date,
      consigneeId,
      buyerId,
      total,
      roundOff,
      vehicleNo,
      transport,
      freight,
      remark,
      jobNo,
      details,
    } = body;

    if (!date || !consigneeId || !buyerId || !details?.length) {
      return NextResponse.json(
        { error: "Date, consignee, buyer, and at least one detail line are required" },
        { status: 400 }
      );
    }

    // Negative stock validation
    for (const detail of details) {
      const available = await prisma.stock.aggregate({
        where: { productId: parseInt(String(detail.productId)), quantity: { gt: 0 } },
        _sum: { quantity: true },
      });
      const availableQty = Number(available._sum.quantity ?? 0);
      if (Number(detail.quantity) > availableQty) {
        const product = await prisma.productMaster.findUnique({
          where: { id: parseInt(String(detail.productId)) },
          select: { name: true },
        });
        return NextResponse.json(
          { error: `Insufficient stock for "${product?.name ?? "product"}". Available: ${availableQty}, Requested: ${detail.quantity}` },
          { status: 400 }
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          date: new Date(date),
          consigneeId: parseInt(consigneeId),
          buyerId: parseInt(buyerId),
          total: parseFloat(total) || 0,
          roundOff: parseFloat(roundOff) || 0,
          vehicleNo: vehicleNo || null,
          transport: transport || null,
          freight: parseFloat(freight) || 0,
          remark: remark || null,
          jobNo: jobNo || null,
          details: {
            create: details.map(
              (d: {
                productId: number;
                quantity: number;
                price: number;
                freight: number;
                total: number;
                salePrice: number;
                remark: string;
                hsn?: string;
                gst?: number;
              }) => ({
                productId: parseInt(String(d.productId)),
                quantity: parseFloat(String(d.quantity)),
                price: parseFloat(String(d.price)),
                freight: parseFloat(String(d.freight)) || 0,
                total: parseFloat(String(d.total)),
                salePrice: parseFloat(String(d.salePrice)) || 0,
                remark: d.remark || null,
                hsn: d.hsn || null,
                gst: d.gst || 0,
              })
            ),
          },
        },
        include: { details: true },
      });

      // Deduct from stock using FIFO
      for (const detail of sale.details) {
        let remaining = Number(detail.quantity);

        const stocks = await tx.stock.findMany({
          where: { productId: detail.productId, quantity: { gt: 0 } },
          orderBy: { addedDate: "asc" },
        });

        for (const stock of stocks) {
          if (remaining <= 0) break;
          const deductQty = Math.min(remaining, Number(stock.quantity));
          await tx.stock.update({
            where: { id: stock.id },
            data: { quantity: { decrement: deductQty } },
          });
          await tx.saleStockRecord.create({
            data: { saleId: sale.id, stockId: stock.id, quantity: deductQty },
          });
          remaining -= deductQty;
        }
      }

      return sale;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: "Failed to create sale" },
      { status: 500 }
    );
  }
}
