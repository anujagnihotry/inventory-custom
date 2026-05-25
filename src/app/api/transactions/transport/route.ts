import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const transports = await prisma.transport.findMany({
      include: {
        buyer: { select: { id: true, name: true } },
        consignee: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(transports);
  } catch (error) {
    console.error("Error fetching transports:", error);
    return NextResponse.json(
      { error: "Failed to fetch transports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      consigneeId, date, buyerId, fromLocation, toLocation,
      transporterName, truckNo, lrDate, truckType, dala, freight, unloadedDate,
    } = body;

    if (!consigneeId || !date || !buyerId) {
      return NextResponse.json(
        { error: "Consignee, date, and buyer are required" },
        { status: 400 }
      );
    }

    const transport = await prisma.transport.create({
      data: {
        consigneeId: Number(consigneeId),
        date: new Date(date),
        buyerId: Number(buyerId),
        fromLocation: fromLocation || null,
        toLocation: toLocation || null,
        transporterName: transporterName || null,
        truckNo: truckNo || null,
        lrDate: lrDate ? new Date(lrDate) : null,
        truckType: truckType || null,
        dala: dala || null,
        freight: Number(freight) || 0,
        unloadedDate: unloadedDate ? new Date(unloadedDate) : null,
      },
    });

    return NextResponse.json(transport, { status: 201 });
  } catch (error) {
    console.error("Error creating transport:", error);
    return NextResponse.json(
      { error: "Failed to create transport" },
      { status: 500 }
    );
  }
}
