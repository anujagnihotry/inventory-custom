import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const expense = await prisma.expenseManager.findUnique({
      where: { id: Number(id) },
      include: {
        buyer: { select: { id: true, name: true } },
        expenseType: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense" },
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
    const { buyerId, jobCardNo, expenseDate, expenseTypeId, amount, remark, productId } = body;

    const expense = await prisma.expenseManager.update({
      where: { id: Number(id) },
      data: {
        buyerId: Number(buyerId),
        jobCardNo: jobCardNo || null,
        expenseDate: new Date(expenseDate),
        expenseTypeId: Number(expenseTypeId),
        amount: Number(amount),
        remark: remark || null,
        productId: productId ? Number(productId) : null,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
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
    await prisma.expenseManager.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
