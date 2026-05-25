import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await prisma.$queryRaw`
      SELECT
        pm."id" as "productId",
        pm."name" as "product",
        c."name" as "category",
        um."name" as "unit",
        COALESCE(SUM(s."quantity"), 0) as "totalStock",
        COALESCE(AVG(s."price"), 0) as "avgPrice",
        COALESCE(SUM(s."quantity" * s."price"), 0) as "totalValue"
      FROM "ProductMaster" pm
      LEFT JOIN "Stock" s ON s."productId" = pm."id"
      LEFT JOIN "Category" c ON c."id" = pm."categoryId"
      LEFT JOIN "UnitMaster" um ON um."id" = pm."unitId"
      GROUP BY pm."id", pm."name", c."name", um."name"
      ORDER BY pm."name"
    `;

    const rows = (data as Record<string, unknown>[]).map((row) => ({
      ...row,
      totalStock: Number(row.totalStock),
      avgPrice: Number(row.avgPrice),
      totalValue: Number(row.totalValue),
    }));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Stock summary error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock summary" },
      { status: 500 }
    );
  }
}
