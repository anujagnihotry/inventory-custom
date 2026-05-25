import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const consignee = await prisma.consignee.findUnique({
      where: { id: parseInt(id) },
    });

    if (!consignee) {
      return NextResponse.json(
        { error: "Consignee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(consignee);
  } catch (error) {
    console.error("Error fetching consignee:", error);
    return NextResponse.json(
      { error: "Failed to fetch consignee" },
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
    const { name, address, city, province, pincode, phoneNo, gst } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const consignee = await prisma.consignee.update({
      where: { id: parseInt(id) },
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

    return NextResponse.json(consignee);
  } catch (error) {
    console.error("Error updating consignee:", error);
    return NextResponse.json(
      { error: "Failed to update consignee" },
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
    await prisma.consignee.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Consignee deleted successfully" });
  } catch (error) {
    console.error("Error deleting consignee:", error);
    return NextResponse.json(
      { error: "Failed to delete consignee" },
      { status: 500 }
    );
  }
}
