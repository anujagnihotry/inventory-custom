import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const scraps = await prisma.scrapFromGodown.findMany({
      include: {
        consignee: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(scraps);
  } catch (error) {
    console.error("Error fetching scrap from godown:", error);
    return NextResponse.json(
      { error: "Failed to fetch scrap from godown" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challanNo, date, consigneeId, supplierId, freight, total, remark, details } = body;

    if (!date || !consigneeId || !supplierId || !details?.length) {
      return NextResponse.json(
        { error: "Date, consignee, supplier, and at least one detail are required" },
        { status: 400 }
      );
    }

    const result = await prisma.scrapFromGodown.create({
      data: {
        challanNo: challanNo || null,
        date: new Date(date),
        consigneeId: Number(consigneeId),
        supplierId: Number(supplierId),
        freight: Number(freight) || 0,
        total: Number(total) || 0,
        remark: remark || null,
        details: {
          create: details.map(
            (d: { productId: number; quantity: number; remark?: string }) => ({
              productId: Number(d.productId),
              quantity: Number(d.quantity),
              remark: d.remark || null,
            })
          ),
        },
      },
      include: { details: true },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating scrap from godown:", error);
    return NextResponse.json(
      { error: "Failed to create scrap from godown" },
      { status: 500 }
    );
  }
}
