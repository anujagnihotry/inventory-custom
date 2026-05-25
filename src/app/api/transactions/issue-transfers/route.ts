import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const transfers = await prisma.issueTransfer.findMany({
      include: {
        buyer: { select: { id: true, name: true } },
        consignee: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(transfers);
  } catch (error) {
    console.error("Error fetching issue transfers:", error);
    return NextResponse.json(
      { error: "Failed to fetch issue transfers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, consigneeId, buyerId, total, vehicleNo, transport, freight, remark, jobNo, details } = body;

    if (!date || !consigneeId || !buyerId || !details?.length) {
      return NextResponse.json(
        { error: "Date, consignee, buyer, and at least one detail are required" },
        { status: 400 }
      );
    }

    const result = await prisma.issueTransfer.create({
      data: {
        date: new Date(date),
        consigneeId: Number(consigneeId),
        buyerId: Number(buyerId),
        total: Number(total) || 0,
        vehicleNo: vehicleNo || null,
        transport: transport || null,
        freight: Number(freight) || 0,
        remark: remark || null,
        jobNo: jobNo || null,
        details: {
          create: details.map(
            (d: { productId: number; quantity: number; price: number; freight?: number; total: number; issuePrice?: number }) => ({
              productId: Number(d.productId),
              quantity: Number(d.quantity),
              price: Number(d.price),
              freight: Number(d.freight) || 0,
              total: Number(d.total),
              issuePrice: Number(d.issuePrice) || 0,
            })
          ),
        },
      },
      include: { details: true },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating issue transfer:", error);
    return NextResponse.json(
      { error: "Failed to create issue transfer" },
      { status: 500 }
    );
  }
}
