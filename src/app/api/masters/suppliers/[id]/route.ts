import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(id) },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return NextResponse.json(
      { error: "Failed to fetch supplier" },
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

    const supplier = await prisma.supplier.update({
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

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Error updating supplier:", error);
    return NextResponse.json(
      { error: "Failed to update supplier" },
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
    const supplierId = parseInt(id);

    const purchaseCount = await prisma.purchase.count({ where: { supplierId } });

    if (purchaseCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete — this supplier is used in ${purchaseCount} purchase${purchaseCount === 1 ? "" : "s"}. Remove those records first.` },
        { status: 400 }
      );
    }

    await prisma.supplier.delete({ where: { id: supplierId } });
    return NextResponse.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json(
      { error: "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
