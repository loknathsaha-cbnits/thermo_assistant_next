import { embedText } from "@/lib/embeddings/embedding";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log(`Query was: Hello world`)
    const vector = await embedText("Hello world");
    console.log("After embed: ", vector)
    return NextResponse.json({ 
      success: true, 
      dimensions: vector.length,
      sample: vector.slice(0, 5) 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}