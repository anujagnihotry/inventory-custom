import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const transports = await prisma.transport.findMany({
      include: {
        buyer: { select: { name: true } },
        consignee: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });

    const rows = transports.map((t) => ({
      id: t.id,
      date: t.date,
      buyer: t.buyer.name,
      consignee: t.consignee.name,
      fromLocation: t.fromLocation,
      toLocation: t.toLocation,
      transporterName: t.transporterName,
      truckNo: t.truckNo,
      lrDate: t.lrDate,
      truckType: t.truckType,
      dala: t.dala,
      freight: Number(t.freight),
      unloadedDate: t.unloadedDate,
    }));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Transport report error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transport report" },
      { status: 500 }
    );
  }
}
