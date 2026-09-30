#!/usr/bin/env node
/**
 * License Password Generator
 * ─────────────────────────────────────────────────────────────────────────────
 * Run this on YOUR machine (not the server) whenever you need the passwords.
 *
 *   LICENSE_SECRET="your-private-key" node scripts/gen-license.js
 *
 * The LICENSE_SECRET must NEVER be placed on the server or in .env.
 * Keep it private — it's the only way to compute the correct passwords.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const crypto  = require("crypto");
const bcrypt  = require("bcryptjs");
const readline = require("readline");

const CHECK_DATES = ["2026-12-01", "2026-12-15", "2027-01-01"];

function derivePassword(secret, date) {
  return crypto
    .createHmac("sha256", secret)
    .update(date)
    .digest("hex")
    .substring(0, 12)
    .toUpperCase();
}

async function main() {
  const secret = process.env.LICENSE_SECRET;

  if (!secret) {
    console.error("\n  ERROR: LICENSE_SECRET environment variable is not set.\n");
    console.error("  Usage:");
    console.error('    Windows PowerShell : $env:LICENSE_SECRET="your-key"; node scripts/gen-license.js');
    console.error('    Mac/Linux          : LICENSE_SECRET="your-key" node scripts/gen-license.js\n');
    process.exit(1);
  }

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║         LICENSE PASSWORD GENERATOR                   ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");
  console.log("  Generating passwords...\n");

  const rows = [];

  for (const date of CHECK_DATES) {
    const password = derivePassword(secret, date);
    const hash     = await bcrypt.hash(password, 12);
    rows.push({ date, password, hash });

    console.log(`  ┌─ Check Date : ${date}`);
    console.log(`  │  Password   : ${password}   ← enter this in the app`);
    console.log(`  └─────────────────────────────────────────────────`);
    console.log("");
  }

  console.log("─".repeat(56));
  console.log("  SQL — run this once on the server to seed the database:");
  console.log("─".repeat(56));
  console.log("");

  for (const { date, hash } of rows) {
    console.log(
      `INSERT INTO "LicenseCheck" ("checkDate", "passwordHash", "verified", "createdAt")`
    );
    console.log(
      `  VALUES ('${date}', '${hash}', false, NOW())`
    );
    console.log(
      `  ON CONFLICT ("checkDate") DO UPDATE`
    );
    console.log(
      `    SET "passwordHash" = EXCLUDED."passwordHash", "verified" = false, "verifiedAt" = NULL;`
    );
    console.log("");
  }

  console.log("─".repeat(56));
  console.log("  IMPORTANT:");
  console.log("  • Write down the passwords above and keep them private.");
  console.log("  • Run the SQL above on the production database.");
  console.log("  • To regenerate passwords later, run this script again");
  console.log("    with the same LICENSE_SECRET — the passwords will be");
  console.log("    identical as long as the secret does not change.");
  console.log("─".repeat(56));
  console.log("");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
