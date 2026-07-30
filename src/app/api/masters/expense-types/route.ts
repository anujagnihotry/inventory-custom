import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const expenseTypes = await prisma.expenseType.findMany({
      where: search
        ? { name: { contains: search, mode: "insensitive" } }
        : undefined,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(expenseTypes);
  } catch (error) {
    console.error("Error fetching expense types:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense types" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const { includeInSiteEvaluation } = body;

    const expenseType = await prisma.expenseType.create({
      data: { name, includeInSiteEvaluation: includeInSiteEvaluation ?? false },
    });

    return NextResponse.json(expenseType, { status: 201 });
  } catch (error) {
    console.error("Error creating expense type:", error);
    return NextResponse.json(
      { error: "Failed to create expense type" },
      { status: 500 }
    );
  }
}
