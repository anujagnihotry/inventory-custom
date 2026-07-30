import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const expenseType = await prisma.expenseType.findUnique({
      where: { id: parseInt(id) },
    });

    if (!expenseType) {
      return NextResponse.json(
        { error: "Expense type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(expenseType);
  } catch (error) {
    console.error("Error fetching expense type:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense type" },
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
    const { name, includeInSiteEvaluation } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const expenseType = await prisma.expenseType.update({
      where: { id: parseInt(id) },
      data: {
        name,
        ...(includeInSiteEvaluation !== undefined && { includeInSiteEvaluation }),
      },
    });

    return NextResponse.json(expenseType);
  } catch (error) {
    console.error("Error updating expense type:", error);
    return NextResponse.json(
      { error: "Failed to update expense type" },
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
    const expenseTypeId = parseInt(id);

    const expenseCount = await prisma.expenseManager.count({ where: { expenseTypeId } });

    if (expenseCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete — this expense type is used in ${expenseCount} expense record${expenseCount === 1 ? "" : "s"}. Remove those records first.` },
        { status: 400 }
      );
    }

    await prisma.expenseType.delete({ where: { id: expenseTypeId } });
    return NextResponse.json({ message: "Expense type deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense type:", error);
    return NextResponse.json(
      { error: "Failed to delete expense type" },
      { status: 500 }
    );
  }
}
