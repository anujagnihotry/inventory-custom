import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: hashedPassword,
      name: "Administrator",
      role: "ADMIN",
    },
  });
  console.log("Admin user created:", adminUser.username);

  // Create initial categories
  const categories = [
    "CAPITAL",
    "CONSUMABLE",
    "SPARES",
    "TOOLS",
    "ASSETS",
    "JOB WORK",
    "RETURNABLE",
    "SCAFFOLDING",
    "PROJECT MATERIAL",
  ];

  for (const name of categories) {
    const existing = await prisma.category.findFirst({ where: { name } });
    if (!existing) {
      await prisma.category.create({ data: { name } });
    }
  }
  console.log("Categories created:", categories.length);

  // Create initial units
  const units = [
    "Nos",
    "Kgs",
    "Meters",
    "Ltrs",
    "Set",
    "Pair",
    "Bags",
    "Box",
    "Roll",
    "Sq.Mtr",
    "Cu.Mtr",
    "Sq.Ft",
  ];

  for (const name of units) {
    const existing = await prisma.unitMaster.findFirst({ where: { name } });
    if (!existing) {
      await prisma.unitMaster.create({ data: { name } });
    }
  }
  console.log("Units created:", units.length);

  // Create form master entries for access control
  const formMasters = [
    "CategoryMaster",
    "ProductMaster",
    "BuyerMaster",
    "ConsigneeMaster",
    "SupplierMaster",
    "FrmPurchase",
    "frmIssue",
    "FrmReturn",
    "FrmStock",
    "ReportsSection",
    "frmExpences",
    "frmTransport",
    "frmIssueTransfer",
    "FrmOrderIssue",
    "frmScrap",
    "frmLoss",
    "frmRepair",
    "frmOpeningStock",
    "frmPurchaseChallan",
    "frmDirectIssue",
  ];

  for (const name of formMasters) {
    const existing = await prisma.formMaster.findFirst({ where: { name } });
    if (!existing) {
      await prisma.formMaster.create({ data: { name } });
    }
  }
  console.log("Form masters created:", formMasters.length);

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
