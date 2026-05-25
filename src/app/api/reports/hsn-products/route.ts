import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await prisma.$queryRaw`
      SELECT DISTINCT
        pm."id" as "productId",
        pm."name" as "product",
        c."name" as "category",
        um."name" as "unit",
        pd."hsn"
      FROM "PurchaseDetail" pd
      INNER JOIN "ProductMaster" pm ON pm."id" = pd."productId"
      LEFT JOIN "Category" c ON c."id" = pm."categoryId"
      LEFT JOIN "UnitMaster" um ON um."id" = pm."unitId"
      WHERE pd."hsn" IS NOT NULL AND pd."hsn" != ''
      ORDER BY pm."name"
    `;

    return NextResponse.json(data);
  } catch (error) {
    console.error("HSN products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch HSN products" },
      { status: 500 }
    );
  }
}
