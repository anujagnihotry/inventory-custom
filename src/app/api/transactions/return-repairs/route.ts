import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const returnRepairs = await prisma.returnRepair.findMany({
      include: {
        buyer: { select: { id: true, name: true } },
      },
      orderBy: { receiveDate: "desc" },
    });

    return NextResponse.json(returnRepairs);
  } catch (error) {
    console.error("Error fetching return repairs:", error);
    return NextResponse.json(
      { error: "Failed to fetch return repairs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceNo, buyerId, vehicleNo, transport, freight, receiveDate, total, jobNo, details } = body;

    if (!buyerId || !receiveDate || !details?.length) {
      return NextResponse.json(
        { error: "Buyer, date, and at least one detail are required" },
        { status: 400 }
      );
    }

    const result = await prisma.returnRepair.create({
      data: {
        invoiceNo: invoiceNo || null,
        buyerId: Number(buyerId),
        vehicleNo: vehicleNo || null,
        transport: transport || null,
        freight: Number(freight) || 0,
        receiveDate: new Date(receiveDate),
        total: Number(total) || 0,
        jobNo: jobNo || null,
        details: {
          create: details.map(
            (d: { productId: number; returnRepairQuantity: number; issuePrice?: number; returnPrice?: number; freight?: number; issueDetailId?: number; issueId?: number }) => ({
              productId: Number(d.productId),
              returnRepairQuantity: Number(d.returnRepairQuantity),
              issuePrice: Number(d.issuePrice) || 0,
              returnPrice: Number(d.returnPrice) || 0,
              freight: Number(d.freight) || 0,
              issueDetailId: d.issueDetailId ? Number(d.issueDetailId) : null,
              issueId: d.issueId ? Number(d.issueId) : null,
            })
          ),
        },
      },
      include: { details: true },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating return repair:", error);
    return NextResponse.json(
      { error: "Failed to create return repair" },
      { status: 500 }
    );
  }
}
