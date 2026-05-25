import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [productCount, purchaseCount, issueCount, stockValue] =
      await Promise.all([
        prisma.productMaster.count(),
        prisma.purchase.count(),
        prisma.issue.count(),
        prisma.$queryRaw`SELECT COALESCE(SUM("quantity" * "price"), 0) as value FROM "Stock"`,
      ]);

    return NextResponse.json({
      productCount,
      purchaseCount,
      issueCount,
      stockValue: (stockValue as { value: number }[])[0].value,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
