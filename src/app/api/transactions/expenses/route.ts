import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const expenses = await prisma.expenseManager.findMany({
      include: {
        buyer: { select: { id: true, name: true } },
        expenseType: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
      },
      orderBy: { expenseDate: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { buyerId, jobCardNo, expenseDate, expenseTypeId, amount, remark, productId } = body;

    if (!buyerId || !expenseDate || !expenseTypeId || !amount) {
      return NextResponse.json(
        { error: "Buyer, date, expense type, and amount are required" },
        { status: 400 }
      );
    }

    const expense = await prisma.expenseManager.create({
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

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
