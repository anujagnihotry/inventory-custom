import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: parseInt(id) },
    });

    if (!subCategory) {
      return NextResponse.json(
        { error: "SubCategory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(subCategory);
  } catch (error) {
    console.error("Error fetching subcategory:", error);
    return NextResponse.json(
      { error: "Failed to fetch subcategory" },
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
    const { name, categoryId } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const subCategory = await prisma.subCategory.update({
      where: { id: parseInt(id) },
      data: {
        name,
        ...(categoryId && { categoryId: parseInt(categoryId) }),
      },
    });

    return NextResponse.json(subCategory);
  } catch (error) {
    console.error("Error updating subcategory:", error);
    return NextResponse.json(
      { error: "Failed to update subcategory" },
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
    const subCategoryId = parseInt(id);

    const productCount = await prisma.productMaster.count({ where: { subCategoryId } });

    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete — this sub-category is used in ${productCount} product${productCount === 1 ? "" : "s"}. Remove those records first.` },
        { status: 400 }
      );
    }

    await prisma.subCategory.delete({ where: { id: subCategoryId } });
    return NextResponse.json({ message: "SubCategory deleted successfully" });
  } catch (error) {
    console.error("Error deleting subcategory:", error);
    return NextResponse.json(
      { error: "Failed to delete subcategory" },
      { status: 500 }
    );
  }
}
