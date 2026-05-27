import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.productMaster.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        subCategory: true,
        unit: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
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
      name,
      categoryId,
      subCategoryId,
      description,
      unitId,
      isConsumable,
      mil,
      item,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const product = await prisma.productMaster.update({
      where: { id: parseInt(id) },
      data: {
        name,
        categoryId: parseInt(categoryId),
        subCategoryId: subCategoryId ? parseInt(subCategoryId) : undefined,
        description: description || null,
        unitId: parseInt(unitId),
        isConsumable: isConsumable ?? false,
        mil: mil || 0,
        item: item || null,
        // itemCode is never updated — it is auto-generated on creation and immutable
      },
      include: {
        category: true,
        subCategory: true,
        unit: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
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
    const productId = parseInt(id);

    const [stockCount, purchaseCount, issueCount, returnCount] = await Promise.all([
      prisma.stock.count({ where: { productId } }),
      prisma.purchaseDetail.count({ where: { productId } }),
      prisma.issueDetail.count({ where: { productId } }),
      prisma.returnDetail.count({ where: { productId } }),
    ]);

    const usages: string[] = [];
    if (stockCount > 0) usages.push(`${stockCount} stock entr${stockCount === 1 ? "y" : "ies"}`);
    if (purchaseCount > 0) usages.push(`${purchaseCount} purchase line${purchaseCount === 1 ? "" : "s"}`);
    if (issueCount > 0) usages.push(`${issueCount} issue line${issueCount === 1 ? "" : "s"}`);
    if (returnCount > 0) usages.push(`${returnCount} return line${returnCount === 1 ? "" : "s"}`);

    if (usages.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete — this product is used in ${usages.join(", ")}. Remove those records first.` },
        { status: 400 }
      );
    }

    await prisma.productMaster.delete({ where: { id: productId } });
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
