import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transport = await prisma.transport.findUnique({
      where: { id: Number(id) },
      include: {
        buyer: { select: { id: true, name: true } },
        consignee: { select: { id: true, name: true } },
      },
    });

    if (!transport) {
      return NextResponse.json({ error: "Transport not found" }, { status: 404 });
    }

    return NextResponse.json(transport);
  } catch (error) {
    console.error("Error fetching transport:", error);
    return NextResponse.json(
      { error: "Failed to fetch transport" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      consigneeId, date, buyerId, fromLocation, toLocation,
      transporterName, truckNo, lrDate, truckType, dala, freight, unloadedDate,
    } = body;

    const transport = await prisma.transport.update({
      where: { id: Number(id) },
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

    return NextResponse.json(transport);
  } catch (error) {
    console.error("Error updating transport:", error);
    return NextResponse.json(
      { error: "Failed to update transport" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.transport.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transport:", error);
    return NextResponse.json(
      { error: "Failed to delete transport" },
      { status: 500 }
    );
  }
}
