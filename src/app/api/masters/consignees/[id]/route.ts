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
    const consigneeId = parseInt(id);

    const [issueCount, transportCount] = await Promise.all([
      prisma.issue.count({ where: { consigneeId } }),
      prisma.transport.count({ where: { consigneeId } }),
    ]);

    const usages: string[] = [];
    if (issueCount > 0) usages.push(`${issueCount} issue${issueCount === 1 ? "" : "s"}`);
    if (transportCount > 0) usages.push(`${transportCount} transport record${transportCount === 1 ? "" : "s"}`);

    if (usages.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete — this consignee is used in ${usages.join(" and ")}. Remove those records first.` },
        { status: 400 }
      );
    }

    await prisma.consignee.delete({ where: { id: consigneeId } });
    return NextResponse.json({ message: "Consignee deleted successfully" });
  } catch (error) {
    console.error("Error deleting consignee:", error);
    return NextResponse.json(
      { error: "Failed to delete consignee" },
      { status: 500 }
    );
  }
}
