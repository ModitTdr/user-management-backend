import { checkDB } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const isConnected = checkDB();
  if (!isConnected) {
    return NextResponse.json({
      status: 500,
      message: "Database is not connected"
    })
  }
  return NextResponse.json({
    status: 200,
    message: "Database is connected"
  })
}
