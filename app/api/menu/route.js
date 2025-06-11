import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    const menu = await prisma.menuItem.findMany({ orderBy: [{ id: "asc" }] });
    return NextResponse.json(menu);
}

export async function POST(request) {
    try {
        const body = await request.json();

        // 檢查必要欄位
        if (!body.name || typeof body.name !== "string") {
            return NextResponse.json(
                { message: "name 是必填欄位" },
                { status: 400 }
            );
        }

        if (typeof body.price !== "number" || isNaN(body.price)) {
            return NextResponse.json(
                { message: "price 必須是數字" },
                { status: 400 }
            );
        }

        // 新增 category 欄位的檢查
        if (!body.category || typeof body.category !== "string") {
            return NextResponse.json(
                { message: "category 是必填欄位" },
                { status: 400 }
            );
        }

        const newMenu = await prisma.menuItem.create({
            data: {
                name: body.name,
                description: body.description || null,
                price: body.price,
                imageUrl: body.imageUrl || null,
                isAvailable:
                    typeof body.isAvailable === "boolean"
                        ? body.isAvailable
                        : true,
                category: body.category, // 確保 category 被儲存
            },
        });

        return NextResponse.json(newMenu);
    } catch (error) {
        console.error("後端錯誤:", error);
        return NextResponse.json(
            { message: "伺服器錯誤", error: String(error) },
            { status: 500 }
        );
    }
}
