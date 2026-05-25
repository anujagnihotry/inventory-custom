import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orderIssues = await prisma.orderIssue.findMany({
      include: {
        buyer: { select: { id: true, name: true } },
        consignee: { select: { id: true, name: true } },
      },
      orderBy: { issueDate: "desc" },
    });

    return NextResponse.json(orderIssues);
  } catch (error) {
    console.error("Error fetching order issues:", error);
    return NextResponse.json(
      { error: "Failed to fetch order issues" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { issueChallanNo, issueDate, consigneeId, buyerId, remark, jobNo, details } = body;

    if (!issueChallanNo || !issueDate || !consigneeId || !buyerId || !details?.length) {
      return NextResponse.json(
        { error: "Challan No, date, consignee, buyer, and at least one detail are required" },
        { status: 400 }
      );
    }

    const result = await prisma.orderIssue.create({
      data: {
        issueChallanNo,
        issueDate: new Date(issueDate),
        consigneeId: Number(consigneeId),
        buyerId: Number(buyerId),
        remark: remark || null,
        jobNo: jobNo || null,
        details: {
          create: details.map((d: { productId: number; quantity: number; remark?: string }) => ({
            productId: Number(d.productId),
            quantity: Number(d.quantity),
            remark: d.remark || null,
          })),
        },
      },
      include: { details: true },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating order issue:", error);
    return NextResponse.json(
      { error: "Failed to create order issue" },
      { status: 500 }
    );
  }
}
