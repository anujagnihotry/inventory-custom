import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const consignees = await prisma.consignee.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { city: { contains: search, mode: "insensitive" } },
              { gst: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(consignees);
  } catch (error) {
    console.error("Error fetching consignees:", error);
    return NextResponse.json(
      { error: "Failed to fetch consignees" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, city, province, pincode, phoneNo, gst } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const consignee = await prisma.consignee.create({
      data: {
        name,
        address: address || null,
        city: city || null,
        province: province || null,
        pincode: pincode || null,
        phoneNo: phoneNo || null,
        gst: gst || null,
      },
    });

    return NextResponse.json(consignee, { status: 201 });
  } catch (error) {
    console.error("Error creating consignee:", error);
    return NextResponse.json(
      { error: "Failed to create consignee" },
      { status: 500 }
    );
  }
}
