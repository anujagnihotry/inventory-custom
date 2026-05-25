import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const stocks = await prisma.stock.findMany({
      where: { transactionId: 0 },
      include: {
        product: { select: { id: true, name: true } },
      },
      orderBy: { addedDate: "desc" },
    });

    return NextResponse.json(stocks);
  } catch (error) {
    console.error("Error fetching opening stock:", error);
    return NextResponse.json(
      { error: "Failed to fetch opening stock" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity, price, addedDate } = body;

    if (!productId || !quantity || !price || !addedDate) {
      return NextResponse.json(
        { error: "Product, quantity, price, and date are required" },
        { status: 400 }
      );
    }

    const stock = await prisma.stock.create({
      data: {
        productId: Number(productId),
        quantity: Number(quantity),
        price: Number(price),
        addedDate: new Date(addedDate),
        transactionId: 0,
      },
    });

    return NextResponse.json(stock, { status: 201 });
  } catch (error) {
    console.error("Error creating opening stock:", error);
    return NextResponse.json(
      { error: "Failed to create opening stock" },
      { status: 500 }
    );
  }
}
