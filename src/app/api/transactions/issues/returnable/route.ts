import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/transactions/issues/returnable?buyerId=X&jobNo=Y
// Returns all issue details for a buyer+jobNo, with remaining returnable quantities.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const buyerId = searchParams.get("buyerId");
    const jobNo = searchParams.get("jobNo");

    if (!buyerId || !jobNo) {
      return NextResponse.json([], { status: 200 });
    }

    const issues = await prisma.issue.findMany({
      where: { buyerId: parseInt(buyerId), jobNo },
      include: {
        details: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
    });

    const lines = [];
    for (const issue of issues) {
      for (const detail of issue.details) {
        // Sum quantities already returned for this specific issue detail
        const returned = await prisma.returnDetail.aggregate({
          where: { issueDetailId: detail.id },
          _sum: { returnQuantity: true },
        });
        const alreadyReturned = Number(returned._sum.returnQuantity ?? 0);
        const remaining = Number(detail.quantity) - alreadyReturned;

        if (remaining > 0) {
          lines.push({
            issueId: issue.id,
            issueDetailId: detail.id,
            productId: detail.productId,
            productName: detail.product.name,
            hsn: detail.hsn || "",
            gst: Number(detail.gst) || 0,
            issuedQty: Number(detail.quantity),
            alreadyReturned,
            remaining,
            issuePrice: Number(detail.issuePrice) || 0,
          });
        }
      }
    }

    return NextResponse.json(lines);
  } catch (error) {
    console.error("Error fetching returnable items:", error);
    return NextResponse.json({ error: "Failed to fetch returnable items" }, { status: 500 });
  }
}
