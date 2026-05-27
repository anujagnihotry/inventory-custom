import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
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
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
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
    const categoryId = parseInt(id);

    const [subCategoryCount, productCount] = await Promise.all([
      prisma.subCategory.count({ where: { categoryId } }),
      prisma.productMaster.count({ where: { categoryId } }),
    ]);

    const usages: string[] = [];
    if (subCategoryCount > 0) usages.push(`${subCategoryCount} sub-categor${subCategoryCount === 1 ? "y" : "ies"}`);
    if (productCount > 0) usages.push(`${productCount} product${productCount === 1 ? "" : "s"}`);

    if (usages.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete — this category is used in ${usages.join(" and ")}. Remove those records first.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id: categoryId } });
    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
