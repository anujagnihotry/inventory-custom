import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const challans = await prisma.purchaseChallan.findMany({
      include: {
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(challans);
  } catch (error) {
    console.error("Error fetching purchase challans:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase challans" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challanNo, date, supplierId, total, gst, netAmount, roundOff, details } = body;

    if (!challanNo || !date || !supplierId || !details?.length) {
      return NextResponse.json(
        { error: "Challan No, date, supplier, and at least one detail are required" },
        { status: 400 }
      );
    }

    const result = await prisma.purchaseChallan.create({
      data: {
        challanNo,
        date: new Date(date),
        supplierId: Number(supplierId),
        total: Number(total) || 0,
        gst: Number(gst) || 0,
        netAmount: Number(netAmount) || 0,
        roundOff: Number(roundOff) || 0,
        details: {
          create: details.map(
            (d: { productId: number; description?: string; hsn?: string; quantity: number; price: number; freight?: number; total: number }) => ({
              productId: Number(d.productId),
              description: d.description || null,
              hsn: d.hsn || null,
              quantity: Number(d.quantity),
              price: Number(d.price),
              freight: Number(d.freight) || 0,
              total: Number(d.total),
            })
          ),
        },
      },
      include: { details: true },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase challan:", error);
    return NextResponse.json(
      { error: "Failed to create purchase challan" },
      { status: 500 }
    );
  }
}
