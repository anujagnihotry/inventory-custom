import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const accessRights = await prisma.accessRight.findMany({
      include: {
        user: { select: { id: true, name: true, username: true } },
        form: { select: { id: true, name: true } },
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(accessRights);
  } catch (error) {
    console.error("Error fetching access rights:", error);
    return NextResponse.json(
      { error: "Failed to fetch access rights" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, formId, canEdit, canSave } = body;

    if (!userId || !formId) {
      return NextResponse.json(
        { error: "User and Form are required" },
        { status: 400 }
      );
    }

    const accessRight = await prisma.accessRight.upsert({
      where: {
        userId_formId: {
          userId: Number(userId),
          formId: Number(formId),
        },
      },
      update: {
        canEdit: canEdit ?? false,
        canSave: canSave ?? false,
      },
      create: {
        userId: Number(userId),
        formId: Number(formId),
        canEdit: canEdit ?? false,
        canSave: canSave ?? false,
      },
      include: {
        user: { select: { id: true, name: true, username: true } },
        form: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(accessRight, { status: 201 });
  } catch (error) {
    console.error("Error creating/updating access right:", error);
    return NextResponse.json(
      { error: "Failed to save access right" },
      { status: 500 }
    );
  }
}
