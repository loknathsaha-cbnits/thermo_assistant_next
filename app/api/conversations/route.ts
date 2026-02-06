import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        title: true,
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'asc'
          },
          select: {
            content: true
          }
        }
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(conversations.map(c => ({
      ...c,
      firstMessage: c.messages[0]?.content || ""
    })));
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
