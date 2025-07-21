import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const PRODUCTS_PATH = path.join(process.cwd(), "public/products.json");

export async function GET() {
  const json = await fs.readFile(PRODUCTS_PATH, "utf-8");
  return NextResponse.json(JSON.parse(json));
}

export async function POST(req: Request) {
  const body = await req.json();
  await fs.writeFile(PRODUCTS_PATH, JSON.stringify(body, null, 2), "utf-8");
  return NextResponse.json({ message: "Saved" });
}
