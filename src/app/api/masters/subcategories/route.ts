import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId");

    const subCategories = await prisma.subCategory.findMany({
      where: {
        ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
        ...(categoryId ? { categoryId: parseInt(categoryId) } : {}),
      },
      include: {
        category: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(subCategories);
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    return NextResponse.json(
      { error: "Failed to fetch subcategories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, categoryId } = body;

    if (!name || !categoryId) {
      return NextResponse.json(
        { error: "Name and Category are required" },
        { status: 400 }
      );
    }

    const subCategory = await prisma.subCategory.create({
      data: { name, categoryId: parseInt(categoryId) },
      include: { category: true },
    });

    return NextResponse.json(subCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating subcategory:", error);
    return NextResponse.json(
      { error: "Failed to create subcategory" },
      { status: 500 }
    );
  }
}
