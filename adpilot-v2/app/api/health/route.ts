import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json({ status: "ok", version: "2.0", service: "adpilot-os-v2" });
}
