import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const consigneeId = searchParams.get("consigneeId");

    const where: Record<string, unknown> = {};
    if (consigneeId) where.consigneeId = parseInt(consigneeId);

    const issues = await prisma.issue.findMany({
      where,
      include: {
        buyer: { select: { name: true } },
        consignee: { select: { name: true } },
        details: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const rows = issues.flatMap((iss) =>
      iss.details.map((d) => ({
        issueId: iss.id,
        date: iss.date,
        buyer: iss.buyer.name,
        consignee: iss.consignee.name,
        jobNo: iss.jobNo,
        product: d.product.name,
        quantity: Number(d.quantity),
        price: Number(d.price),
        issuePrice: Number(d.issuePrice),
        freight: Number(d.freight),
        total: Number(d.total),
        remark: d.remark,
      }))
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Consignee issue error:", error);
    return NextResponse.json(
      { error: "Failed to fetch consignee issue report" },
      { status: 500 }
    );
  }
}
