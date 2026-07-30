import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting demo reset — deleting all transaction and non-product master data...\n");

  // ── Step 1: leaf tables that reference both transaction parents AND Stock/Issue ──
  const r1 = await prisma.issueStockRecord.deleteMany({});
  console.log(`IssueStockRecord:       ${r1.count} deleted`);

  const r2 = await prisma.scrapFromStock.deleteMany({});
  console.log(`ScrapFromStock:         ${r2.count} deleted`);

  // ReturnDetail and ReturnRepairDetail reference Issue (nullable, no cascade) — must go before Issue
  const r3 = await prisma.returnDetail.deleteMany({});
  console.log(`ReturnDetail:           ${r3.count} deleted`);

  const r4 = await prisma.returnRepairDetail.deleteMany({});
  console.log(`ReturnRepairDetail:     ${r4.count} deleted`);

  // ── Step 2: remaining detail tables ──
  const r5 = await prisma.purchaseDetail.deleteMany({});
  console.log(`PurchaseDetail:         ${r5.count} deleted`);

  const r6 = await prisma.purchaseChallanDetail.deleteMany({});
  console.log(`PurchaseChallanDetail:  ${r6.count} deleted`);

  const r7 = await prisma.issueDetail.deleteMany({});
  console.log(`IssueDetail:            ${r7.count} deleted`);

  const r8 = await prisma.issueTransferDetail.deleteMany({});
  console.log(`IssueTransferDetail:    ${r8.count} deleted`);

  const r9 = await prisma.orderIssueDetail.deleteMany({});
  console.log(`OrderIssueDetail:       ${r9.count} deleted`);

  const r10 = await prisma.scrapFromGodownDetail.deleteMany({});
  console.log(`ScrapFromGodownDetail:  ${r10.count} deleted`);

  const r11 = await prisma.repairFromGodownDetail.deleteMany({});
  console.log(`RepairFromGodownDetail: ${r11.count} deleted`);

  // ── Step 3: standalone transaction rows referencing Buyer / ProductMaster ──
  const r12 = await prisma.loss.deleteMany({});
  console.log(`Loss:                   ${r12.count} deleted`);

  const r13 = await prisma.scrap.deleteMany({});
  console.log(`Scrap:                  ${r13.count} deleted`);

  const r14 = await prisma.expenseManager.deleteMany({});
  console.log(`ExpenseManager:         ${r14.count} deleted`);

  const r15 = await prisma.transport.deleteMany({});
  console.log(`Transport:              ${r15.count} deleted`);

  // ── Step 4: Stock (refs Purchase nullable) ──
  const r16 = await prisma.stock.deleteMany({});
  console.log(`Stock:                  ${r16.count} deleted`);

  // ── Step 5: issue-family headers ──
  const r17 = await prisma.issue.deleteMany({});
  console.log(`Issue:                  ${r17.count} deleted`);

  const r18 = await prisma.issueTransfer.deleteMany({});
  console.log(`IssueTransfer:          ${r18.count} deleted`);

  const r19 = await prisma.orderIssue.deleteMany({});
  console.log(`OrderIssue:             ${r19.count} deleted`);

  const r20 = await prisma.return.deleteMany({});
  console.log(`Return:                 ${r20.count} deleted`);

  const r21 = await prisma.returnRepair.deleteMany({});
  console.log(`ReturnRepair:           ${r21.count} deleted`);

  // ── Step 6: purchase headers ──
  const r22 = await prisma.purchase.deleteMany({});
  console.log(`Purchase:               ${r22.count} deleted`);

  const r23 = await prisma.purchaseChallan.deleteMany({});
  console.log(`PurchaseChallan:        ${r23.count} deleted`);

  // ── Step 7: godown headers ──
  const r24 = await prisma.scrapFromGodown.deleteMany({});
  console.log(`ScrapFromGodown:        ${r24.count} deleted`);

  const r25 = await prisma.repairFromGodown.deleteMany({});
  console.log(`RepairFromGodown:       ${r25.count} deleted`);

  // ── Step 8: master data being cleared ──
  const r26 = await prisma.buyer.deleteMany({});
  console.log(`Buyer:                  ${r26.count} deleted`);

  const r27 = await prisma.supplier.deleteMany({});
  console.log(`Supplier:               ${r27.count} deleted`);

  const r28 = await prisma.consignee.deleteMany({});
  console.log(`Consignee:              ${r28.count} deleted`);

  const r29 = await prisma.logging.deleteMany({});
  console.log(`Logging:                ${r29.count} deleted`);

  console.log("\nDone. Kept: Category, SubCategory, ProductMaster, UnitMaster, ExpenseType, User, AccessRight.");
}

main()
  .catch((e) => { console.error("Error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
