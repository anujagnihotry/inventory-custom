import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const buyerId = searchParams.get("buyerId");
    const jobNo = searchParams.get("jobNo");

    if (!buyerId) {
      return NextResponse.json(
        { error: "buyerId is required" },
        { status: 400 }
      );
    }

    const bid = parseInt(buyerId);

    const issueWhere: Record<string, unknown> = { buyerId: bid };
    if (jobNo) issueWhere.jobNo = jobNo;

    const expenseWhere: Record<string, unknown> = { buyerId: bid };
    if (jobNo) expenseWhere.jobCardNo = jobNo;

    const [issues, expenses] = await Promise.all([
      prisma.issue.findMany({
        where: issueWhere,
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
      }),
      prisma.expenseManager.findMany({
        where: expenseWhere,
        include: {
          expenseType: { select: { name: true } },
          product: { select: { name: true } },
        },
        orderBy: { expenseDate: "desc" },
      }),
    ]);

    const issueRows = issues.flatMap((iss) =>
      iss.details.map((d) => ({
        type: "Issue" as const,
        date: iss.date,
        description: d.product.name,
        consignee: iss.consignee.name,
        quantity: Number(d.quantity),
        price: Number(d.price),
        total: Number(d.total),
        jobNo: iss.jobNo,
      }))
    );

    const expenseRows = expenses.map((e) => ({
      type: "Expense" as const,
      date: e.expenseDate,
      description: `${e.expenseType.name}${e.product ? ` - ${e.product.name}` : ""}`,
      consignee: "",
      quantity: 0,
      price: 0,
      total: Number(e.amount),
      jobNo: e.jobCardNo,
    }));

    const allRows = [...issueRows, ...expenseRows].sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const totalIssuesValue = issueRows.reduce((s, r) => s + r.total, 0);
    const totalExpenses = expenseRows.reduce((s, r) => s + r.total, 0);

    return NextResponse.json({
      rows: allRows,
      summary: {
        totalIssuesValue,
        totalExpenses,
        grandTotal: totalIssuesValue + totalExpenses,
      },
    });
  } catch (error) {
    console.error("Site evaluation error:", error);
    return NextResponse.json(
      { error: "Failed to fetch site evaluation" },
      { status: 500 }
    );
  }
}
