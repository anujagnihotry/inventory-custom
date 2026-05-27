import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const buyer = await prisma.buyer.findUnique({
      where: { id: parseInt(id) },
    });

    if (!buyer) {
      return NextResponse.json(
        { error: "Buyer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(buyer);
  } catch (error) {
    console.error("Error fetching buyer:", error);
    return NextResponse.json(
      { error: "Failed to fetch buyer" },
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

    const buyer = await prisma.buyer.update({
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

    return NextResponse.json(buyer);
  } catch (error) {
    console.error("Error updating buyer:", error);
    return NextResponse.json(
      { error: "Failed to update buyer" },
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
    const buyerId = parseInt(id);

    const [issueCount, returnCount, expenseCount, transportCount] = await Promise.all([
      prisma.issue.count({ where: { buyerId } }),
      prisma.return.count({ where: { buyerId } }),
      prisma.expenseManager.count({ where: { buyerId } }),
      prisma.transport.count({ where: { buyerId } }),
    ]);

    const usages: string[] = [];
    if (issueCount > 0) usages.push(`${issueCount} issue${issueCount === 1 ? "" : "s"}`);
    if (returnCount > 0) usages.push(`${returnCount} return${returnCount === 1 ? "" : "s"}`);
    if (expenseCount > 0) usages.push(`${expenseCount} expense${expenseCount === 1 ? "" : "s"}`);
    if (transportCount > 0) usages.push(`${transportCount} transport record${transportCount === 1 ? "" : "s"}`);

    if (usages.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete — this buyer is used in ${usages.join(", ")}. Remove those records first.` },
        { status: 400 }
      );
    }

    await prisma.buyer.delete({ where: { id: buyerId } });
    return NextResponse.json({ message: "Buyer deleted successfully" });
  } catch (error) {
    console.error("Error deleting buyer:", error);
    return NextResponse.json(
      { error: "Failed to delete buyer" },
      { status: 500 }
    );
  }
}
