import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const captains = await prisma.user.findMany({
            where: {
                role: "CAPTAIN",
                isActive: true
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatarUrl: true
            }
        });

        return NextResponse.json(captains);
    } catch (err) {
        console.error("獲取派送人員失敗:", err);
        return NextResponse.json(
            { message: "伺服器錯誤" },
            { status: 500 }
        );
    }
} 