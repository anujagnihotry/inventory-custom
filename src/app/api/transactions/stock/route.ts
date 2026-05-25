import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const stockSummary = await prisma.$queryRaw`
      SELECT
        p.id,
        p.name AS "productName",
        c.name AS "categoryName",
        u.name AS "unitName",
        COALESCE(SUM(s.quantity), 0) AS "totalStock",
        COALESCE(AVG(s.price), 0) AS "avgPrice"
      FROM "ProductMaster" p
      LEFT JOIN "Stock" s ON s."productId" = p.id
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      LEFT JOIN "UnitMaster" u ON u.id = p."unitId"
      GROUP BY p.id, p.name, c.name, u.name
      ORDER BY p.name ASC
    `;

    // Convert Decimal types to numbers for JSON serialization
    const result = (stockSummary as Record<string, unknown>[]).map((row) => ({
      id: row.id,
      productName: row.productName,
      categoryName: row.categoryName,
      unitName: row.unitName,
      totalStock: Number(row.totalStock),
      avgPrice: Number(row.avgPrice),
      totalValue: Number(row.totalStock) * Number(row.avgPrice),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching stock summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock summary" },
      { status: 500 }
    );
  }
}
