import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const scraps = await prisma.scrap.findMany({
      include: {
        buyer: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(scraps);
  } catch (error) {
    console.error("Error fetching scraps:", error);
    return NextResponse.json(
      { error: "Failed to fetch scraps" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { buyerId, jobNo, productId, quantity, price, date, issueDetailsId } = body;

    if (!buyerId || !productId || !quantity || !price || !date) {
      return NextResponse.json(
        { error: "Buyer, product, quantity, price, and date are required" },
        { status: 400 }
      );
    }

    const scrap = await prisma.scrap.create({
      data: {
        buyerId: Number(buyerId),
        jobNo: jobNo || null,
        productId: Number(productId),
        quantity: Number(quantity),
        price: Number(price),
        date: new Date(date),
        issueDetailsId: issueDetailsId ? Number(issueDetailsId) : null,
      },
    });

    return NextResponse.json(scrap, { status: 201 });
  } catch (error) {
    console.error("Error creating scrap:", error);
    return NextResponse.json(
      { error: "Failed to create scrap" },
      { status: 500 }
    );
  }
}
