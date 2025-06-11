import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();

        // 檢查必要欄位
        if (!body.name || typeof body.name !== "string") {
            return Response.json(
                { message: "name 是必填欄位" },
                { status: 400 }
            );
        }

        if (typeof body.price !== "number" || isNaN(body.price)) {
            return Response.json(
                { message: "price 必須是數字" },
                { status: 400 }
            );
        }

        // 確認該菜單是否存在
        const existingItem = await prisma.menuItem.findUnique({
            where: { id },
        });

        if (!existingItem) {
            return Response.json(
                { message: "找不到菜單項目" },
                { status: 404 }
            );
        }

        // 執行更新
        const updatedMenu = await prisma.menuItem.update({
            where: { id },
            data: {
                name: body.name,
                description: body.description || null,
                price: body.price,
                imageUrl: body.imageUrl || null,
                isAvailable:
                    typeof body.isAvailable === "boolean"
                        ? body.isAvailable
                        : true,
            },
        });

        return Response.json(updatedMenu);
    } catch (error) {
        console.error("後端錯誤:", error);
        return Response.json(
            { message: "伺服器錯誤", error: String(error) },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = params;

        // 確認該菜單是否存在
        const existingItem = await prisma.menuItem.findUnique({
            where: { id },
        });

        if (!existingItem) {
            return NextResponse.json(
                { message: "找不到菜單項目" },
                { status: 404 }
            );
        }

        // 執行刪除
        await prisma.menuItem.delete({
            where: { id },
        });

        return NextResponse.json(
            { message: "菜單項目已成功刪除" },
            { status: 200 }
        );
    } catch (error) {
        console.error("刪除菜單項目失敗:", error);
        return NextResponse.json(
            { message: "伺服器錯誤", error: String(error) },
            { status: 500 }
        );
    }
}
