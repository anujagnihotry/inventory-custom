import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const products = await prisma.productMaster.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { itemCode: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: {
        category: true,
        subCategory: true,
        unit: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

async function generateItemCode(): Promise<string> {
  // Find the highest existing SC-prefixed item code
  const last = await prisma.productMaster.findFirst({
    where: { itemCode: { startsWith: "SC" } },
    orderBy: { itemCode: "desc" },
    select: { itemCode: true },
  });

  let nextNum = 1;
  if (last?.itemCode) {
    const num = parseInt(last.itemCode.replace("SC", ""), 10);
    if (!isNaN(num)) nextNum = num + 1;
  }

  return `SC${String(nextNum).padStart(4, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
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
      gst,
      hsn,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const itemCode = await generateItemCode();

    const product = await prisma.productMaster.create({
      data: {
        name,
        categoryId: parseInt(categoryId),
        subCategoryId: subCategoryId ? parseInt(subCategoryId) : undefined,
        description: description || null,
        unitId: parseInt(unitId),
        isConsumable: isConsumable ?? false,
        mil: mil || 0,
        item: item || null,
        gst: gst || 0,
        hsn: hsn || null,
        itemCode,
      },
      include: {
        category: true,
        subCategory: true,
        unit: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
