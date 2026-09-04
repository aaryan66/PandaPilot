import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const userMessage: string = body.message;

  const reply = `You asked about: "${userMessage}". (Real answer coming soon.)`;

  return NextResponse.json({ reply });
}