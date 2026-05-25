-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(250) NOT NULL,
    "contactNo" VARCHAR(50),
    "email" VARCHAR(250),
    "username" VARCHAR(50) NOT NULL,
    "passwordHash" VARCHAR(250) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(250) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubCategory" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(250) NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "SubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitMaster" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(250) NOT NULL,

    CONSTRAINT "UnitMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMaster" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(250) NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "subCategoryId" INTEGER,
    "description" TEXT,
    "unitId" INTEGER NOT NULL,
    "isConsumable" BOOLEAN NOT NULL DEFAULT false,
    "mil" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "item" VARCHAR(250),
    "itemCode" VARCHAR(250),

    CONSTRAINT "ProductMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Buyer" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(250) NOT NULL,
    "address" TEXT,
    "city" VARCHAR(250),
    "province" VARCHAR(250),
    "pincode" VARCHAR(10),
    "phoneNo" VARCHAR(20),
    "gst" VARCHAR(50),

    CONSTRAINT "Buyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consignee" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(250) NOT NULL,
    "address" TEXT,
    "city" VARCHAR(250),
    "province" VARCHAR(250),
    "pincode" VARCHAR(10),
    "phoneNo" VARCHAR(20),
    "gst" VARCHAR(50),

    CONSTRAINT "Consignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(250) NOT NULL,
    "address" TEXT,
    "city" VARCHAR(250),
    "province" VARCHAR(250),
    "pincode" VARCHAR(10),
    "phoneNo" VARCHAR(20),
    "gst" VARCHAR(50),

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(300) NOT NULL,

    CONSTRAINT "ExpenseType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormMaster" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "FormMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessRight" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "formId" INTEGER NOT NULL,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canSave" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AccessRight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" SERIAL NOT NULL,
    "invoiceNo" VARCHAR(50) NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "total" DECIMAL(18,4) NOT NULL,
    "gst" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "vehicleNo" VARCHAR(20),
    "transport" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseDetail" (
    "id" SERIAL NOT NULL,
    "purchaseId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "description" TEXT,
    "hsn" VARCHAR(50),
    "quantity" DECIMAL(18,4) NOT NULL,
    "price" DECIMAL(18,4) NOT NULL,
    "freight" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "PurchaseDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseChallan" (
    "id" SERIAL NOT NULL,
    "challanNo" VARCHAR(50) NOT NULL,
    "date" DATE NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "total" DECIMAL(18,4) NOT NULL,
    "gst" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseChallan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseChallanDetail" (
    "id" SERIAL NOT NULL,
    "purchaseChallanId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "description" TEXT,
    "hsn" VARCHAR(50),
    "quantity" DECIMAL(18,4) NOT NULL,
    "price" DECIMAL(18,4) NOT NULL,
    "freight" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "PurchaseChallanDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" SERIAL NOT NULL,
    "purchaseId" INTEGER,
    "productId" INTEGER NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "price" DECIMAL(18,4) NOT NULL,
    "addedDate" DATE NOT NULL,
    "transactionId" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "consigneeId" INTEGER NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "total" DECIMAL(18,4) NOT NULL,
    "vehicleNo" VARCHAR(20),
    "transport" VARCHAR(300),
    "freight" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "remark" TEXT,
    "jobNo" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueDetail" (
    "id" SERIAL NOT NULL,
    "issueId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "price" DECIMAL(18,4) NOT NULL,
    "freight" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,4) NOT NULL,
    "issuePrice" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "remark" TEXT,

    CONSTRAINT "IssueDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueStockRecord" (
    "id" SERIAL NOT NULL,
    "issueId" INTEGER NOT NULL,
    "stockId" INTEGER NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "IssueStockRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueTransfer" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "consigneeId" INTEGER NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "total" DECIMAL(18,4) NOT NULL,
    "vehicleNo" VARCHAR(20),
    "transport" VARCHAR(300),
    "freight" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "remark" TEXT,
    "jobNo" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueTransferDetail" (
    "id" SERIAL NOT NULL,
    "issueTransferId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "price" DECIMAL(18,4) NOT NULL,
    "freight" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,4) NOT NULL,
    "issuePrice" DECIMAL(18,4) NOT NULL DEFAULT 0,

    CONSTRAINT "IssueTransferDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderIssue" (
    "id" SERIAL NOT NULL,
    "issueChallanNo" VARCHAR(50) NOT NULL,
    "issueDate" DATE NOT NULL,
    "consigneeId" INTEGER NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "remark" TEXT,
    "jobNo" VARCHAR(50),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderIssueDetail" (
    "id" SERIAL NOT NULL,
    "orderIssueId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "remark" TEXT,

    CONSTRAINT "OrderIssueDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Return" (
    "id" SERIAL NOT NULL,
    "invoiceNo" VARCHAR(150),
    "buyerId" INTEGER NOT NULL,
    "vehicleNo" VARCHAR(50),
    "transport" VARCHAR(300),
    "freight" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "returnDate" DATE NOT NULL,
    "total" DECIMAL(18,4) NOT NULL,
    "jobNo" VARCHAR(50),
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnDetail" (
    "id" SERIAL NOT NULL,
    "returnId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "returnQuantity" DECIMAL(18,4) NOT NULL,
    "issuePrice" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "returnPrice" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "freight" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "issueDetailId" INTEGER,
    "issueId" INTEGER,

    CONSTRAINT "ReturnDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnRepair" (
    "id" SERIAL NOT NULL,
    "invoiceNo" VARCHAR(150),
    "buyerId" INTEGER NOT NULL,
    "vehicleNo" VARCHAR(50),
    "transport" VARCHAR(300),
    "freight" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "receiveDate" DATE NOT NULL,
    "total" DECIMAL(18,4) NOT NULL,
    "jobNo" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnRepair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnRepairDetail" (
    "id" SERIAL NOT NULL,
    "returnRepairId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "returnRepairQuantity" DECIMAL(18,4) NOT NULL,
    "issuePrice" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "returnPrice" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "freight" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "issueDetailId" INTEGER,
    "issueId" INTEGER,

    CONSTRAINT "ReturnRepairDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loss" (
    "id" SERIAL NOT NULL,
    "issueDetailsId" INTEGER,
    "buyerId" INTEGER NOT NULL,
    "jobNo" VARCHAR(50),
    "productId" INTEGER NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "price" DECIMAL(18,4) NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "Loss_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scrap" (
    "id" SERIAL NOT NULL,
    "issueDetailsId" INTEGER,
    "buyerId" INTEGER NOT NULL,
    "jobNo" VARCHAR(50),
    "productId" INTEGER NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "price" DECIMAL(18,4) NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "Scrap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapFromGodown" (
    "id" SERIAL NOT NULL,
    "challanNo" VARCHAR(50),
    "date" DATE NOT NULL,
    "consigneeId" INTEGER NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "freight" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,3) NOT NULL,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScrapFromGodown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapFromGodownDetail" (
    "id" SERIAL NOT NULL,
    "scrapFromGodownId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "remark" VARCHAR(300),

    CONSTRAINT "ScrapFromGodownDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapFromStock" (
    "id" SERIAL NOT NULL,
    "stockId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" DECIMAL(18,2) NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "ScrapFromStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairFromGodown" (
    "id" SERIAL NOT NULL,
    "challanNo" VARCHAR(50),
    "date" DATE NOT NULL,
    "consigneeId" INTEGER NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "freight" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,3) NOT NULL,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepairFromGodown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairFromGodownDetail" (
    "id" SERIAL NOT NULL,
    "repairFromGodownId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "remark" VARCHAR(300),

    CONSTRAINT "RepairFromGodownDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transport" (
    "id" SERIAL NOT NULL,
    "consigneeId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "fromLocation" VARCHAR(300),
    "toLocation" VARCHAR(300),
    "transporterName" VARCHAR(300),
    "truckNo" VARCHAR(100),
    "lrDate" DATE,
    "truckType" VARCHAR(300),
    "dala" VARCHAR(300),
    "freight" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "unloadedDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseManager" (
    "id" SERIAL NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "jobCardNo" VARCHAR(50),
    "expenseDate" DATE NOT NULL,
    "expenseTypeId" INTEGER NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "remark" TEXT,
    "productId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Logging" (
    "id" SERIAL NOT NULL,
    "errorText" TEXT,
    "query" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Logging_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "AccessRight_userId_formId_key" ON "AccessRight"("userId", "formId");

-- AddForeignKey
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMaster" ADD CONSTRAINT "ProductMaster_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMaster" ADD CONSTRAINT "ProductMaster_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMaster" ADD CONSTRAINT "ProductMaster_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "UnitMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRight" ADD CONSTRAINT "AccessRight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRight" ADD CONSTRAINT "AccessRight_formId_fkey" FOREIGN KEY ("formId") REFERENCES "FormMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseDetail" ADD CONSTRAINT "PurchaseDetail_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseDetail" ADD CONSTRAINT "PurchaseDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseChallan" ADD CONSTRAINT "PurchaseChallan_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseChallanDetail" ADD CONSTRAINT "PurchaseChallanDetail_purchaseChallanId_fkey" FOREIGN KEY ("purchaseChallanId") REFERENCES "PurchaseChallan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseChallanDetail" ADD CONSTRAINT "PurchaseChallanDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_consigneeId_fkey" FOREIGN KEY ("consigneeId") REFERENCES "Consignee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueDetail" ADD CONSTRAINT "IssueDetail_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueDetail" ADD CONSTRAINT "IssueDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueStockRecord" ADD CONSTRAINT "IssueStockRecord_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueStockRecord" ADD CONSTRAINT "IssueStockRecord_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueTransfer" ADD CONSTRAINT "IssueTransfer_consigneeId_fkey" FOREIGN KEY ("consigneeId") REFERENCES "Consignee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueTransfer" ADD CONSTRAINT "IssueTransfer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueTransferDetail" ADD CONSTRAINT "IssueTransferDetail_issueTransferId_fkey" FOREIGN KEY ("issueTransferId") REFERENCES "IssueTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueTransferDetail" ADD CONSTRAINT "IssueTransferDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderIssue" ADD CONSTRAINT "OrderIssue_consigneeId_fkey" FOREIGN KEY ("consigneeId") REFERENCES "Consignee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderIssue" ADD CONSTRAINT "OrderIssue_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderIssueDetail" ADD CONSTRAINT "OrderIssueDetail_orderIssueId_fkey" FOREIGN KEY ("orderIssueId") REFERENCES "OrderIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderIssueDetail" ADD CONSTRAINT "OrderIssueDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnDetail" ADD CONSTRAINT "ReturnDetail_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "Return"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnDetail" ADD CONSTRAINT "ReturnDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnDetail" ADD CONSTRAINT "ReturnDetail_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRepair" ADD CONSTRAINT "ReturnRepair_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRepairDetail" ADD CONSTRAINT "ReturnRepairDetail_returnRepairId_fkey" FOREIGN KEY ("returnRepairId") REFERENCES "ReturnRepair"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRepairDetail" ADD CONSTRAINT "ReturnRepairDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRepairDetail" ADD CONSTRAINT "ReturnRepairDetail_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loss" ADD CONSTRAINT "Loss_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loss" ADD CONSTRAINT "Loss_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scrap" ADD CONSTRAINT "Scrap_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scrap" ADD CONSTRAINT "Scrap_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapFromGodown" ADD CONSTRAINT "ScrapFromGodown_consigneeId_fkey" FOREIGN KEY ("consigneeId") REFERENCES "Consignee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapFromGodown" ADD CONSTRAINT "ScrapFromGodown_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapFromGodownDetail" ADD CONSTRAINT "ScrapFromGodownDetail_scrapFromGodownId_fkey" FOREIGN KEY ("scrapFromGodownId") REFERENCES "ScrapFromGodown"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapFromGodownDetail" ADD CONSTRAINT "ScrapFromGodownDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapFromStock" ADD CONSTRAINT "ScrapFromStock_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapFromStock" ADD CONSTRAINT "ScrapFromStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairFromGodown" ADD CONSTRAINT "RepairFromGodown_consigneeId_fkey" FOREIGN KEY ("consigneeId") REFERENCES "Consignee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairFromGodown" ADD CONSTRAINT "RepairFromGodown_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairFromGodownDetail" ADD CONSTRAINT "RepairFromGodownDetail_repairFromGodownId_fkey" FOREIGN KEY ("repairFromGodownId") REFERENCES "RepairFromGodown"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairFromGodownDetail" ADD CONSTRAINT "RepairFromGodownDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transport" ADD CONSTRAINT "Transport_consigneeId_fkey" FOREIGN KEY ("consigneeId") REFERENCES "Consignee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transport" ADD CONSTRAINT "Transport_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseManager" ADD CONSTRAINT "ExpenseManager_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseManager" ADD CONSTRAINT "ExpenseManager_expenseTypeId_fkey" FOREIGN KEY ("expenseTypeId") REFERENCES "ExpenseType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseManager" ADD CONSTRAINT "ExpenseManager_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;
