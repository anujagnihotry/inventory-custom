import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Category ID mappings (product categories — not expense types)
const CAT_CONSUMABLE = 2;
const CAT_RETURNABLE = [3, 4, 5]; // SPARES, TOOLS, ASSETS

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const buyerId = searchParams.get("buyerId");
    const jobNo = searchParams.get("jobNo") || undefined;

    if (!buyerId) {
      return NextResponse.json({ error: "buyerId is required" }, { status: 400 });
    }

    const bid = parseInt(buyerId);

    // ── Resolve expense type roles dynamically — no hardcoded IDs ────────────
    const roleTypes = await prisma.expenseType.findMany({
      where: { siteEvaluationRole: { not: null } },
      select: { id: true, siteEvaluationRole: true },
    });
    const roleToId: Record<string, number> = Object.fromEntries(
      roleTypes.map((et) => [et.siteEvaluationRole!, et.id])
    );
    const roleIds = roleTypes.map((et) => et.id);

    const ET_FREIGHT              = roleToId["freight"];
    const ET_ACT_RET_CONSUMABLE   = roleToId["actual_returned_consumable"];
    const ET_ACT_RET_RETURNABLE   = roleToId["actual_returned_returnable"];
    const ET_CONSUMABLE           = roleToId["consumable_expense"];
    const ET_RETURNABLE           = roleToId["returnable_expense"];

    const buyer = await prisma.buyer.findUnique({ where: { id: bid }, select: { name: true } });
    const buyerName = buyer?.name ?? "";

    const issueWhere = { buyerId: bid, ...(jobNo ? { jobNo } : {}) };
    const expWhere   = { buyerId: bid, ...(jobNo ? { jobCardNo: jobNo } : {}) };
    const retWhere   = { buyerId: bid, ...(jobNo ? { jobNo } : {}) };

    // ── 1. CONSUMABLE ─────────────────────────────────────────────────────────
    const consumableIssues = await prisma.issueDetail.aggregate({
      where: { issue: issueWhere, product: { categoryId: CAT_CONSUMABLE } },
      _sum: { total: true },
    });
    const consumableExpense = ET_CONSUMABLE
      ? await prisma.expenseManager.aggregate({
          where: { ...expWhere, expenseTypeId: ET_CONSUMABLE },
          _sum: { amount: true },
        })
      : { _sum: { amount: 0 } };
    const consumableValue =
      Number(consumableIssues._sum.total ?? 0) +
      Number(consumableExpense._sum.amount ?? 0);

    // ── 2. RETURNABLE ─────────────────────────────────────────────────────────
    const returnableIssues = await prisma.issueDetail.aggregate({
      where: { issue: issueWhere, product: { categoryId: { in: CAT_RETURNABLE } } },
      _sum: { total: true },
    });
    const returnableExpense = ET_RETURNABLE
      ? await prisma.expenseManager.aggregate({
          where: { ...expWhere, expenseTypeId: ET_RETURNABLE },
          _sum: { amount: true },
        })
      : { _sum: { amount: 0 } };
    const returnableValue =
      Number(returnableIssues._sum.total ?? 0) +
      Number(returnableExpense._sum.amount ?? 0);

    // ── 3. Other Expenses — types marked includeInSiteEvaluation, no role ─────
    const otherExpenses = await prisma.expenseManager.groupBy({
      by: ["expenseTypeId"],
      where: {
        ...expWhere,
        expenseTypeId: { notIn: roleIds },
        expenseType: { includeInSiteEvaluation: true },
      },
      _sum: { amount: true },
    });
    const otherExpenseTypes = await prisma.expenseType.findMany({
      where: { id: { in: otherExpenses.map((e) => e.expenseTypeId) } },
    });
    const etMap: Record<number, string> = Object.fromEntries(
      otherExpenseTypes.map((et) => [et.id, et.name])
    );

    // ── 4. ACTUAL RETURNED CONSUMABLE (negative) ──────────────────────────────
    const retConsDetails = await prisma.returnDetail.findMany({
      where: { return: retWhere, product: { categoryId: CAT_CONSUMABLE } },
      select: { returnPrice: true, returnQuantity: true },
    });
    const retConsFromItems = retConsDetails.reduce(
      (sum, d) => sum + Number(d.returnPrice) * Number(d.returnQuantity),
      0
    );
    const retConsExpense = ET_ACT_RET_CONSUMABLE
      ? await prisma.expenseManager.aggregate({
          where: { ...expWhere, expenseTypeId: ET_ACT_RET_CONSUMABLE },
          _sum: { amount: true },
        })
      : { _sum: { amount: 0 } };
    const retConsumableValue =
      -(retConsFromItems + Number(retConsExpense._sum.amount ?? 0));

    // ── 5. ACTUAL RETURNED RETURNABLE (negative) ──────────────────────────────
    const retRetDetails = await prisma.returnDetail.findMany({
      where: { return: retWhere, product: { categoryId: { in: CAT_RETURNABLE } } },
      select: { returnPrice: true, returnQuantity: true },
    });
    const retRetFromItems = retRetDetails.reduce(
      (sum, d) => sum + Number(d.returnPrice) * Number(d.returnQuantity),
      0
    );
    const retRetExpense = ET_ACT_RET_RETURNABLE
      ? await prisma.expenseManager.aggregate({
          where: { ...expWhere, expenseTypeId: ET_ACT_RET_RETURNABLE },
          _sum: { amount: true },
        })
      : { _sum: { amount: 0 } };
    const retReturnableValue =
      -(retRetFromItems + Number(retRetExpense._sum.amount ?? 0));

    // ── 6. FREIGHT ────────────────────────────────────────────────────────────
    const issueFreight = await prisma.issue.aggregate({
      where: issueWhere,
      _sum: { freight: true },
    });
    const returnFreight = await prisma.return.aggregate({
      where: retWhere,
      _sum: { freight: true },
    });
    const freightExpense = ET_FREIGHT
      ? await prisma.expenseManager.aggregate({
          where: { ...expWhere, expenseTypeId: ET_FREIGHT },
          _sum: { amount: true },
        })
      : { _sum: { amount: 0 } };
    const freightValue =
      Number(issueFreight._sum.freight ?? 0) +
      Number(returnFreight._sum.freight ?? 0) +
      Number(freightExpense._sum.amount ?? 0);

    // ── Assemble rows ─────────────────────────────────────────────────────────
    const rows: { buyer: string; name: string; value: number; type: string }[] = [];

    rows.push({ buyer: buyerName, name: "Consumable",  value: consumableValue,  type: "Expences" });
    rows.push({ buyer: buyerName, name: "Returnable",  value: returnableValue,  type: "Expences" });

    for (const oe of otherExpenses) {
      rows.push({
        buyer: buyerName,
        name: etMap[oe.expenseTypeId] ?? String(oe.expenseTypeId),
        value: Number(oe._sum.amount ?? 0),
        type: "Expences",
      });
    }

    rows.push({ buyer: buyerName, name: "ACTUAL RETURNED CONSUMABLE",               value: retConsumableValue,  type: "Return" });
    rows.push({ buyer: buyerName, name: "ACTUAL RETURNED (TOOLS, SPARES & ASSETS)", value: retReturnableValue,  type: "Return" });
    rows.push({ buyer: buyerName, name: "Freight",                                  value: freightValue,        type: "Expences" });

    // ── Summary ───────────────────────────────────────────────────────────────
    const expencesTotal = rows.filter((r) => r.type === "Expences").reduce((s, r) => s + r.value, 0);
    const returnsTotal  = rows.filter((r) => r.type === "Return").reduce((s, r) => s + r.value, 0);

    return NextResponse.json({
      rows,
      summary: { expencesTotal, returnsTotal, grandTotal: expencesTotal + returnsTotal },
    });
  } catch (error) {
    console.error("Site evaluation error:", error);
    return NextResponse.json({ error: "Failed to fetch site evaluation" }, { status: 500 });
  }
}
