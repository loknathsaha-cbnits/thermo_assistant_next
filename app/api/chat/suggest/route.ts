import { NextResponse } from "next/server";
import { suggestQuestions } from "@/lib/search/questionSearch";
import { ingestIfNeeded } from "@/scripts/ingest";

export const dynamic = 'force-dynamic';
// OPTIONAL: Run ingestion once when the module is loaded (simple for dev)
// In production, might trigger this via a dedicated webhook or CLI script.
let isIngested = false;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        if (!body.query) return NextResponse.json({ error: "Query required" }, { status: 400 });

        // 1. Ensure data is there (only runs once per server lifecycle)
        if (!isIngested) {
            await ingestIfNeeded();
            isIngested = true;
        }

        // 2. Perform the semantic search
        const suggestions = await suggestQuestions(body.query, 3);
        console.log(suggestions)

        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error("Suggestion API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}