import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
    try {
        // 刪除所有用戶
        await prisma.user.deleteMany({});

        return NextResponse.json({
            message: "所有用戶已成功刪除"
        });
    } catch (error) {
        console.error("刪除用戶失敗:", error);
        return NextResponse.json(
            { message: "刪除用戶失敗", error: String(error) },
            { status: 500 }
        );
    }
} 